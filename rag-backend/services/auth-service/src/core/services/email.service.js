const { NodemailerClient } = require('../../infrastructure/external/email/nodemailer.client');
const { logger } = require('@rag-platform/logger');

class EmailService {
    constructor() {
        this.client = new NodemailerClient();
    }

    async sendOTPEmail(email, code, type = 'VERIFICATION') {
        const subject = type === 'VERIFICATION' 
            ? 'Verify Your Email Address' 
            : 'Reset Your Password';

        const html = this.getOTPEmailTemplate(code, type);

        try {
            await this.client.sendEmail(email, subject, html);
            logger.info(`OTP email sent to ${email} for ${type}`);
        } catch (error) {
            logger.error(`Failed to send OTP email to ${email}:`, error);
            throw new Error('Failed to send verification email');
        }
    }

    async sendVerificationEmail(email, code) {
        return this.sendOTPEmail(email, code, 'VERIFICATION');
    }

    async sendPasswordResetEmail(email, code) {
        return this.sendOTPEmail(email, code, 'PASSWORD_RESET');
    }

    getOTPEmailTemplate(code, type) {
        const purpose = type === 'VERIFICATION' 
            ? 'verify your email address' 
            : 'reset your password';

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${type === 'VERIFICATION' ? 'Email Verification' : 'Password Reset'}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2c3e50;">${type === 'VERIFICATION' ? 'Verify Your Email' : 'Reset Your Password'}</h2>
        <p>Hello,</p>
        <p>You have requested to ${purpose}. Please use the following verification code:</p>
        <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h1 style="color: #3498db; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p style="margin-top: 30px; color: #7f8c8d; font-size: 12px;">
            Best regards,<br>
            RAG Platform Team
        </p>
    </div>
</body>
</html>
        `.trim();
    }
}

module.exports = { EmailService };

