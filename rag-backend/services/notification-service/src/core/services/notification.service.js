const nodemailer = require('nodemailer');

class NotificationService {
    constructor() {
        this.emailTransporter = nodemailer.createTransport({
            /* SMTP Config */
            host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
            port: 2525,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendEmail(to, subject, content) {
        return this.emailTransporter.sendMail({
            from: 'noreply@ragplatform.com',
            to,
            subject,
            html: content
        });
    }
}

module.exports = { NotificationService };
