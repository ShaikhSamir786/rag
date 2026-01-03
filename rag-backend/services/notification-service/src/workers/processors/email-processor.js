const { Worker } = require('bullmq');
const { NotificationService } = require('../../core/services/notification.service');
const { logger } = require('@rag-platform/logger');

const notificationService = new NotificationService();

const setupWorker = () => {
    const worker = new Worker('email-notifications', async (job) => {
        logger.info(`Sending email to ${job.data.to}`);
        await notificationService.sendEmail(job.data.to, job.data.subject, job.data.content);
        logger.info('Email sent successfully');
    }, {
        connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: 6379
        }
    });

    return worker;
};

module.exports = { setupWorker };
