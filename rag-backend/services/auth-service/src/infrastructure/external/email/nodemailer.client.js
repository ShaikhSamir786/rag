const nodemailer = require('nodemailer');
const { logger } = require('@rag-platform/logger');
const { email: emailConfig } = require('../../../config');

class NodemailerClient {
    constructor() {
        this.transporter = null;
        this.initialize();
    }

    initialize() {
        try {
            this.transporter = nodemailer.createTransport({
                host: emailConfig.host,
                port: emailConfig.port,
                secure: emailConfig.secure,
                auth: emailConfig.auth.user ? {
                    user: emailConfig.auth.user,
                    pass: emailConfig.auth.pass
                } : undefined
            });

            // Verify connection
            this.transporter.verify((error, success) => {
                if (error) {
                    logger.error('Email transporter verification failed:', error);
                } else {
                    logger.info('Email transporter ready');
                }
            });
        } catch (error) {
            logger.error('Failed to initialize email transporter:', error);
        }
    }

    async sendEmail(to, subject, html, text = null) {
        if (!this.transporter) {
            throw new Error('Email transporter not initialized');
        }

        try {
            const mailOptions = {
                from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
                to,
                subject,
                html,
                text: text || this.htmlToText(html)
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Email sent to ${to}: ${info.messageId}`);
            return info;
        } catch (error) {
            logger.error('Failed to send email:', error);
            throw error;
        }
    }

    htmlToText(html) {
        // Simple HTML to text conversion
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
    }
}

module.exports = { NodemailerClient };

