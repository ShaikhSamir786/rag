const bcrypt = require('bcryptjs');
const { User } = require('../../domain/models/user.model');
const { OTPService } = require('./otp.service');
const { logger } = require('@rag-platform/logger');
const { security } = require('../../config');
const { BaseError, ErrorCode } = require('@rag-platform/common');

class PasswordService {
    constructor() {
        this.otpService = new OTPService();
        this.saltRounds = 12;
    }

    validatePasswordStrength(password) {
        const errors = [];

        if (password.length < security.password.minLength) {
            errors.push(`Password must be at least ${security.password.minLength} characters long`);
        }

        if (security.password.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (security.password.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (security.password.requireNumbers && !/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        if (security.password.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    async hashPassword(password) {
        return await bcrypt.hash(password, this.saltRounds);
    }

    async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    async changePassword(userId, oldPassword, newPassword) {
        // Validate new password strength
        const validation = this.validatePasswordStrength(newPassword);
        if (!validation.isValid) {
            throw new BaseError(
                ErrorCode.VALIDATION_ERROR,
                validation.errors.join(', '),
                400
            );
        }

        // Get user
        const user = await User.findByPk(userId);
        if (!user) {
            throw new BaseError(ErrorCode.RESOURCE_NOT_FOUND, 'User not found', 404);
        }

        // Verify old password
        const isOldPasswordValid = await this.comparePassword(oldPassword, user.password);
        if (!isOldPasswordValid) {
            throw new BaseError(ErrorCode.UNAUTHORIZED, 'Current password is incorrect', 401);
        }

        // Check password history (prevent reuse)
        // Note: In a full implementation, you'd store password history in a separate table
        // For now, we'll just check if new password matches current password
        const isSamePassword = await this.comparePassword(newPassword, user.password);
        if (isSamePassword) {
            throw new BaseError(
                ErrorCode.VALIDATION_ERROR,
                'New password must be different from current password',
                400
            );
        }

        // Hash and update password
        const hashedPassword = await this.hashPassword(newPassword);
        await user.update({ password: hashedPassword });

        logger.info(`Password changed for user ${userId}`);
        return user;
    }

    async requestPasswordReset(email) {
        // Find user by email
        const user = await User.findOne({ where: { email } });
        
        // Don't reveal if user exists or not (security best practice)
        if (!user) {
            logger.warn(`Password reset requested for non-existent email: ${email}`);
            // Still return success to prevent email enumeration
            return { message: 'If the email exists, a password reset code has been sent' };
        }

        // Generate and send OTP
        await this.otpService.generateAndSendOTP(email, user.id, 'PASSWORD_RESET');

        logger.info(`Password reset OTP sent to ${email}`);
        return { message: 'If the email exists, a password reset code has been sent' };
    }

    async resetPassword(email, otpCode, newPassword) {
        // Validate new password strength
        const validation = this.validatePasswordStrength(newPassword);
        if (!validation.isValid) {
            throw new BaseError(
                ErrorCode.VALIDATION_ERROR,
                validation.errors.join(', '),
                400
            );
        }

        // Validate OTP
        const otp = await this.otpService.validateOTP(email, otpCode, 'PASSWORD_RESET');

        // Get user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new BaseError(ErrorCode.RESOURCE_NOT_FOUND, 'User not found', 404);
        }

        // Verify OTP belongs to user
        if (otp.userId && otp.userId !== user.id) {
            throw new BaseError(ErrorCode.VALIDATION_ERROR, 'Invalid OTP', 400);
        }

        // Hash and update password
        const hashedPassword = await this.hashPassword(newPassword);
        await user.update({ password: hashedPassword });

        // Reset failed login attempts
        await user.update({
            failedLoginAttempts: 0,
            accountLockedUntil: null
        });

        logger.info(`Password reset for user ${user.id}`);
        return user;
    }
}

module.exports = { PasswordService };

