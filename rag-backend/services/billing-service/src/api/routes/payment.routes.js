const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const {
    validateCreatePaymentIntent,
    validateConfirmPaymentIntent,
    validateIdParam,
    validateListQuery
} = require('../validators/billing.validator');
const { idempotencyMiddleware, checkIdempotency } = require('../../core/middlewares/idempotency.middleware');

// Create payment intent
router.post(
    '/intent',
    idempotencyMiddleware,
    checkIdempotency,
    validateCreatePaymentIntent,
    paymentController.createPaymentIntent.bind(paymentController)
);

// Confirm payment intent
router.post(
    '/:id/confirm',
    validateIdParam,
    validateConfirmPaymentIntent,
    paymentController.confirmPaymentIntent.bind(paymentController)
);

// Get payment intent
router.get(
    '/:id',
    validateIdParam,
    paymentController.getPaymentIntent.bind(paymentController)
);

// Get payment status
router.get(
    '/:id/status',
    validateIdParam,
    paymentController.getPaymentStatus.bind(paymentController)
);

// Cancel payment intent
router.post(
    '/:id/cancel',
    validateIdParam,
    paymentController.cancelPaymentIntent.bind(paymentController)
);

// List payments
router.get(
    '/',
    validateListQuery,
    paymentController.listPayments.bind(paymentController)
);

module.exports = router;

