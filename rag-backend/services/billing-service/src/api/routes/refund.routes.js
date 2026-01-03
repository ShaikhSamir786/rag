const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refund.controller');
const {
    validateCreateRefund,
    validateIdParam
} = require('../validators/billing.validator');

// Create refund
router.post(
    '/',
    validateCreateRefund,
    refundController.createRefund.bind(refundController)
);

// Get refund
router.get(
    '/:id',
    validateIdParam,
    refundController.getRefund.bind(refundController)
);

// Get refunds by transaction
router.get(
    '/transaction/:transactionId',
    refundController.getRefundsByTransaction.bind(refundController)
);

// Get refunds by order
router.get(
    '/order/:orderId',
    refundController.getRefundsByOrder.bind(refundController)
);

// List refunds
router.get(
    '/',
    refundController.listRefunds.bind(refundController)
);

module.exports = router;

