const { OTP } = require('../../domain/models/otp.model');
const { EmailService } = require('./email.service');
const { redisClient } = require('../../infrastructure/cache/redis-client');
const { logger } = require('@rag-platform/logger');
const { security } = require('../../config');
const { BaseError, ErrorCode } = require('@rag-platform/common');
const { Op } = require('sequelize');

class OTPService {
    constructor() {
        this.emailService = new EmailService();
    }

    generateOTP(length = security.otp.length) {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * digits.length)];
        }
        return otp;
    }

    async checkRateLimit(email, type) {
        const rateLimitKey = `otp:rate:${email}:${type}`;
        const count = await redisClient.incr(rateLimitKey);
        
        if (count === 1) {
            // Set expiry on first request
            await redisClient.expire(rateLimitKey, Math.floor(security.rateLimit.otpWindowMs / 1000));
        }

        if (count > security.otp.rateLimitPerHour) {
            throw new BaseError(
                ErrorCode.VALIDATION_ERROR,
                `Too many OTP requests. Please try again after ${Math.floor(security.rateLimit.otpWindowMs / 60000)} minutes.`,
                429
            );
        }
    }

    async generateAndSendOTP(email, userId, type = 'VERIFICATION') {
        // Check rate limit
        await this.checkRateLimit(email, type);

        // Invalidate any existing unused OTPs of the same type
        await OTP.update(
            { isUsed: true },
            {
                where: {
                    email,
                    type,
                    isUsed: false,
                    expiresAt: { [Op.gt]: new Date() }
                }
            }
        );

        // Generate new OTP
        const code = this.generateOTP();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + security.otp.expiryMinutes);

        // Store OTP
        const otp = await OTP.create({
            userId,
            email,
            code,
            type,
            expiresAt,
            attempts: 0,
            isUsed: false
        });

        // Send email
        try {
            if (type === 'VERIFICATION') {
                await this.emailService.sendVerificationEmail(email, code);
            } else {
                await this.emailService.sendPasswordResetEmail(email, code);
            }
        } catch (error) {
            // If email fails, delete the OTP
            await otp.destroy();
            throw error;
        }

        logger.info(`OTP generated for ${email}, type: ${type}`);
        return otp;
    }

    async validateOTP(email, code, type = 'VERIFICATION') {
        const otp = await OTP.findOne({
            where: {
                email,
                code,
                type,
                isUsed: false,
                expiresAt: { [Op.gt]: new Date() }
            },
            order: [['createdAt', 'DESC']]
        });

        if (!otp) {
            throw new BaseError(
                ErrorCode.VALIDATION_ERROR,
                'Invalid or expired OTP code',
                400
            );
        }

        // Check attempt limit
        if (otp.attempts >= security.otp.maxAttempts) {
            await otp.update({ isUsed: true });
            throw new BaseError(
                ErrorCode.VALIDATION_ERROR,
                'OTP code has exceeded maximum attempts. Please request a new code.',
                400
            );
        }

        // Increment attempts
        await otp.increment('attempts');

        // Mark as used
        await otp.update({ isUsed: true });

        logger.info(`OTP validated for ${email}, type: ${type}`);
        return otp;
    }

    async cleanupExpiredOTPs() {
        const deleted = await OTP.destroy({
            where: {
                [Op.or]: [
                    { expiresAt: { [Op.lt]: new Date() } },
                    { isUsed: true, updatedAt: { [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Delete used OTPs older than 24 hours
                ]
            }
        });

        if (deleted > 0) {
            logger.info(`Cleaned up ${deleted} expired OTPs`);
        }

        return deleted;
    }

    async getOTPByEmail(email, type = 'VERIFICATION') {
        return await OTP.findOne({
            where: {
                email,
                type,
                isUsed: false,
                expiresAt: { [Op.gt]: new Date() }
            },
            order: [['createdAt', 'DESC']]
        });
    }
}

module.exports = { OTPService };

