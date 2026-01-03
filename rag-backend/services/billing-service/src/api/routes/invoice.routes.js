const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { validateIdParam } = require('../validators/billing.validator');

// Generate invoice from order
router.post(
    '/order/:orderId',
    invoiceController.generateInvoice.bind(invoiceController)
);

// Get invoice
router.get(
    '/:id',
    validateIdParam,
    invoiceController.getInvoice.bind(invoiceController)
);

// Download invoice PDF
router.get(
    '/:id/download',
    validateIdParam,
    invoiceController.downloadInvoicePDF.bind(invoiceController)
);

module.exports = router;



