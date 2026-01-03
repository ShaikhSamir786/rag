const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const { rawBodyMiddleware, verifyWebhookSignature } = require('../../core/middlewares/webhook-auth.middleware');

// Stripe webhook endpoint
router.post(
    '/stripe',
    rawBodyMiddleware,
    verifyWebhookSignature('stripe'),
    webhookController.handleStripeWebhook.bind(webhookController)
);

module.exports = router;


