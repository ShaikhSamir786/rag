const bcrypt = require('bcryptjs');
const { User } = require('../../domain/models/user.model');
const { TokenService } = require('./token.service');
const { SessionService } = require('./session.service');
const { OTPService } = require('./otp.service');
const { PasswordService } = require('./password.service');
const { BaseError, ErrorCode } = require('@rag-platform/common');
const { logger } = require('@rag-platform/logger');
const { security } = require('../../config');

class AuthService {
    constructor() {
        this.tokenService = new TokenService();
        this.sessionService = new SessionService();
        this.otpService = new OTPService();
        this.passwordService = new PasswordService();
    }

    async login(email, password, tenantId, deviceInfo = {}, ipAddress = null) {
        const user = await User.findOne({ where: { email, tenantId } });

        if (!user) {
            throw new BaseError(ErrorCode.UNAUTHORIZED, 'Invalid credentials', 401);
        }

        // Check if account is locked
        if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
            const minutesLeft = Math.ceil((user.accountLockedUntil - new Date()) / 60000);
            throw new BaseError(
                ErrorCode.UNAUTHORIZED,
                `Account is locked. Please try again in ${minutesLeft} minute(s).`,
                423
            );
        }

        // If lock period has passed, reset failed attempts
        if (user.accountLockedUntil && new Date() >= user.accountLockedUntil) {
            await user.update({
                failedLoginAttempts: 0,
                accountLockedUntil: null
            });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) {
            // Increment failed attempts
            const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
            
            if (newFailedAttempts >= security.account.maxFailedLoginAttempts) {
                // Lock account
                const lockUntil = new Date();
                lockUntil.setMinutes(lockUntil.getMinutes() + security.account.lockDurationMinutes);
                
                await user.update({
                    failedLoginAttempts: newFailedAttempts,
                    accountLockedUntil: lockUntil
                });

                throw new BaseError(
                    ErrorCode.UNAUTHORIZED,
                    `Too many failed login attempts. Account locked for ${security.account.lockDurationMinutes} minutes.`,
                    423
                );
            } else {
                await user.update({ failedLoginAttempts: newFailedAttempts });
                throw new BaseError(ErrorCode.UNAUTHORIZED, 'Invalid credentials', 401);
            }
        }

        // Reset failed attempts on successful login
        await user.update({
            failedLoginAttempts: 0,
            accountLockedUntil: null,
            lastLoginAt: new Date()
        });

        // Generate tokens
        const accessToken = this.tokenService.generateAccessToken({
            id: user.id,
            tenantId: user.tenantId,
            role: user.role,
            email: user.email
        });

        const refreshToken = this.tokenService.generateRefreshToken({
            id: user.id,
            tenantId: user.tenantId,
            role: user.role,
            email: user.email
        });

        // Create session
        const session = await this.sessionService.createSession(
            user.id,
            refreshToken,
            deviceInfo,
            ipAddress
        );

        logger.info(`User ${user.id} logged in successfully`);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                emailVerified: user.emailVerified,
                role: user.role
            },
            accessToken,
            refreshToken,
            sessionId: session.id
        };
    }

    async register(userData, tenantId) {
        // Check if user already exists
        const existing = await User.findOne({ 
            where: { 
                email: userData.email, 
                tenantId 
            } 
        });

        if (existing) {
            throw new BaseError(ErrorCode.VALIDATION_ERROR, 'User already exists', 400);
        }

        // Validate password strength
        const passwordValidation = this.passwordService.validatePasswordStrength(userData.password);
        if (!passwordValidation.isValid) {
            throw new BaseError(
                ErrorCode.VALIDATION_ERROR,
                passwordValidation.errors.join(', '),
                400
            );
        }

        // Hash password
        const hashedPassword = await this.passwordService.hashPassword(userData.password);

        // Create user
        const user = await User.create({
            ...userData,
            password: hashedPassword,
            tenantId,
            emailVerified: false,
            provider: 'email',
            role: userData.role || 'user'
        });

        // Generate and send verification OTP
        try {
            await this.otpService.generateAndSendOTP(user.email, user.id, 'VERIFICATION');
        } catch (error) {
            logger.error(`Failed to send verification OTP to ${user.email}:`, error);
            // Don't fail registration if email fails - user can request resend
        }

        // Generate tokens (user can use service but with limited access until verified)
        const accessToken = this.tokenService.generateAccessToken({
            id: user.id,
            tenantId: user.tenantId,
            role: user.role,
            email: user.email
        });

        const refreshToken = this.tokenService.generateRefreshToken({
            id: user.id,
            tenantId: user.tenantId,
            role: user.role,
            email: user.email
        });

        logger.info(`User ${user.id} registered successfully`);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                emailVerified: user.emailVerified,
                role: user.role
            },
            accessToken,
            refreshToken,
            message: 'Registration successful. Please verify your email address.'
        };
    }

    async verifyEmail(email, otpCode) {
        // Validate OTP
        const otp = await this.otpService.validateOTP(email, otpCode, 'VERIFICATION');

        // Get user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new BaseError(ErrorCode.RESOURCE_NOT_FOUND, 'User not found', 404);
        }

        // Verify OTP belongs to user
        if (otp.userId && otp.userId !== user.id) {
            throw new BaseError(ErrorCode.VALIDATION_ERROR, 'Invalid OTP', 400);
        }

        // Mark email as verified
        await user.update({
            emailVerified: true,
            emailVerifiedAt: new Date()
        });

        logger.info(`Email verified for user ${user.id}`);
        return { message: 'Email verified successfully', user };
    }

    async resendVerification(email) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            // Don't reveal if user exists
            return { message: 'If the email exists, a verification code has been sent' };
        }

        if (user.emailVerified) {
            throw new BaseError(ErrorCode.VALIDATION_ERROR, 'Email is already verified', 400);
        }

        await this.otpService.generateAndSendOTP(email, user.id, 'VERIFICATION');
        logger.info(`Verification OTP resent to ${email}`);
        return { message: 'If the email exists, a verification code has been sent' };
    }

    async logout(refreshToken, userId) {
        // Get session
        const session = await this.sessionService.getSessionByRefreshToken(refreshToken);
        
        if (session && session.userId === userId) {
            // Revoke session
            await this.sessionService.revokeSession(session.id, userId);
        } else {
            // Still blacklist the token even if session not found
            await this.tokenService.blacklistToken(refreshToken);
        }

        logger.info(`User ${userId} logged out`);
        return { message: 'Logged out successfully' };
    }

    async refreshTokens(refreshToken) {
        // Verify refresh token
        const decoded = await this.tokenService.verifyRefreshToken(refreshToken);

        // Validate session
        const session = await this.sessionService.validateSession(refreshToken);
        if (session.userId !== decoded.id) {
            throw new BaseError(ErrorCode.UNAUTHORIZED, 'Invalid session', 401);
        }

        // Generate new tokens (token rotation)
        const newTokens = await this.tokenService.refreshTokens(refreshToken);

        // Update session with new refresh token
        await session.update({ refreshToken: newTokens.refreshToken });

        return newTokens;
    }
}

module.exports = { AuthService };
