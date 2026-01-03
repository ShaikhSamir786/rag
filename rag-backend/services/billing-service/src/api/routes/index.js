const express = require('express');
const router = express.Router();
const paymentRoutes = require('./payment.routes');
const webhookRoutes = require('./webhook.routes');
const refundRoutes = require('./refund.routes');
const invoiceRoutes = require('./invoice.routes');

// Payment routes
router.use('/payments', paymentRoutes);

// Webhook routes
router.use('/webhooks', webhookRoutes);

// Refund routes
router.use('/refunds', refundRoutes);

// Invoice routes
router.use('/invoices', invoiceRoutes);

module.exports = router;



