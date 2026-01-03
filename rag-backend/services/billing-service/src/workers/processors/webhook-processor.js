const { WebhookService } = require('../../../core/services/webhook.service');
const { logger } = require('@rag-platform/logger');

const webhookService = new WebhookService();

/**
 * Process webhook event
 */
async function processWebhookEvent(job) {
    const { webhookEventId, tenantId } = job.data;

    logger.info('Processing webhook event', {
        webhookEventId,
        tenantId,
        jobId: job.id
    });

    try {
        await webhookService.processStoredWebhookEvent(webhookEventId, tenantId);

        logger.info('Webhook event processed successfully', {
            webhookEventId,
            tenantId,
            jobId: job.id
        });

        return { success: true, webhookEventId };
    } catch (error) {
        logger.error('Failed to process webhook event', {
            webhookEventId,
            tenantId,
            error: error.message,
            stack: error.stack,
            jobId: job.id
        });

        throw error;
    }
}

module.exports = {
    processWebhookEvent
};

