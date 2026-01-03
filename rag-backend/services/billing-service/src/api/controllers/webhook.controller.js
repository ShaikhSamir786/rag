const { WebhookService } = require('../../core/services/webhook.service');
const { logger } = require('@rag-platform/logger');
const { webhookQueue } = require('../../infrastructure/queue/billing-queue');

const webhookService = new WebhookService();

class WebhookController {
    /**
     * Handle Stripe webhook
     */
    async handleStripeWebhook(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'] || req.body?.data?.object?.metadata?.tenantId;
            const signature = req.webhookSignature || req.headers['stripe-signature'];
            const payload = req.rawBody || JSON.stringify(req.body);

            if (!tenantId) {
                return res.status(400).json({
                    error: 'Tenant ID is required'
                });
            }

            // Process webhook event
            const result = await webhookService.processWebhookEvent(
                'stripe',
                payload,
                signature,
                tenantId
            );

            // If not a duplicate, queue for async processing
            if (!result.duplicate && result.webhookEventId) {
                try {
                    await webhookQueue.add('process-webhook', {
                        webhookEventId: result.webhookEventId,
                        tenantId
                    });
                } catch (queueError) {
                    logger.error('Failed to queue webhook event', {
                        webhookEventId: result.webhookEventId,
                        error: queueError.message
                    });
                }
            }

            // Always return 200 to Stripe
            res.status(200).json({ received: true });
        } catch (error) {
            logger.error('Failed to process webhook', {
                error: error.message,
                stack: error.stack
            });
            
            // Still return 200 to prevent Stripe from retrying
            // Log the error for manual investigation
            res.status(200).json({ received: true, error: 'Processing failed' });
        }
    }
}

module.exports = new WebhookController();

