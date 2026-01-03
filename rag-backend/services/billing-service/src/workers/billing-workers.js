const { QueueManager } = require('@rag-platform/queue');
const { webhookQueue, invoiceQueue, paymentStatusQueue } = require('../infrastructure/queue/billing-queue');
const { processWebhookEvent } = require('./processors/webhook-processor');
const { generateInvoice } = require('./processors/invoice-processor');
const { updatePaymentStatus } = require('./processors/payment-processor');
const { logger } = require('@rag-platform/logger');

const queueManager = QueueManager.getInstance();

/**
 * Initialize all workers
 */
function initializeWorkers() {
    // Webhook processing worker
    const webhookWorker = queueManager.createWorker('webhook-processing', async (job) => {
        return processWebhookEvent(job);
    }, {
        concurrency: 5,
        limiter: {
            max: 10,
            duration: 1000
        }
    });

    webhookWorker.on('completed', (job) => {
        logger.info('Webhook job completed', {
            jobId: job.id,
            webhookEventId: job.data.webhookEventId
        });
    });

    webhookWorker.on('failed', (job, err) => {
        logger.error('Webhook job failed', {
            jobId: job.id,
            webhookEventId: job.data.webhookEventId,
            error: err.message
        });
    });

    // Invoice generation worker
    const invoiceWorker = queueManager.createWorker('invoice-generation', async (job) => {
        return generateInvoice(job);
    }, {
        concurrency: 3
    });

    invoiceWorker.on('completed', (job) => {
        logger.info('Invoice job completed', {
            jobId: job.id,
            orderId: job.data.orderId
        });
    });

    invoiceWorker.on('failed', (job, err) => {
        logger.error('Invoice job failed', {
            jobId: job.id,
            orderId: job.data.orderId,
            error: err.message
        });
    });

    // Payment status update worker
    const paymentStatusWorker = queueManager.createWorker('payment-status-update', async (job) => {
        return updatePaymentStatus(job);
    }, {
        concurrency: 5
    });

    paymentStatusWorker.on('completed', (job) => {
        logger.info('Payment status job completed', {
            jobId: job.id,
            paymentIntentId: job.data.paymentIntentId
        });
    });

    paymentStatusWorker.on('failed', (job, err) => {
        logger.error('Payment status job failed', {
            jobId: job.id,
            paymentIntentId: job.data.paymentIntentId,
            error: err.message
        });
    });

    logger.info('Billing workers initialized');

    return {
        webhookWorker,
        invoiceWorker,
        paymentStatusWorker
    };
}

module.exports = {
    initializeWorkers
};

