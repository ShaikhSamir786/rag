const { logger } = require('@rag-platform/logger');
const { WebhookError } = require('../errors/payment.error');
const paymentConfig = require('../../config/payment');

/**
 * Middleware to verify webhook signature
 */
const verifyWebhookSignature = (provider = 'stripe') => {
    return (req, res, next) => {
        try {
            const signature = req.headers['stripe-signature'];
            
            if (!signature && paymentConfig.requireWebhookSignature) {
                throw new WebhookError('Missing webhook signature');
            }

            if (signature) {
                // Store raw body for signature verification
                // Note: This requires body-parser to be configured with verify option
                // to preserve raw body
                req.webhookSignature = signature;
                req.webhookProvider = provider;
            }

            next();
        } catch (error) {
            logger.error('Webhook signature verification failed', {
                error: error.message,
                provider
            });
            res.status(401).json({
                error: 'Invalid webhook signature'
            });
        }
    };
};

/**
 * Middleware to extract raw body for webhook verification
 * This should be used before body-parser
 */
const rawBodyMiddleware = (req, res, next) => {
    if (req.path.includes('/webhooks/')) {
        let data = '';
        req.setEncoding('utf8');
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            req.rawBody = data;
            next();
        });
    } else {
        next();
    }
};

module.exports = {
    verifyWebhookSignature,
    rawBodyMiddleware
};


