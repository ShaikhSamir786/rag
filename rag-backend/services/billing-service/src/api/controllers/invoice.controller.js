const { InvoiceService } = require('../../core/services/invoice.service');
const { logger } = require('@rag-platform/logger');

const invoiceService = new InvoiceService();

class InvoiceController {
    /**
     * Generate invoice from order
     */
    async generateInvoice(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const { orderId } = req.params;

            if (!tenantId) {
                return res.status(400).json({
                    error: 'Tenant ID is required'
                });
            }

            const invoice = await invoiceService.generateInvoiceFromOrder(orderId, tenantId);

            res.status(201).json(invoice);
        } catch (error) {
            logger.error('Failed to generate invoice', {
                error: error.message
            });
            next(error);
        }
    }

    /**
     * Get invoice
     */
    async getInvoice(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const { id } = req.params;

            if (!tenantId) {
                return res.status(400).json({
                    error: 'Tenant ID is required'
                });
            }

            const invoice = await invoiceService.getInvoice(id, tenantId);

            res.json(invoice);
        } catch (error) {
            logger.error('Failed to get invoice', {
                invoiceId: req.params.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * Download invoice PDF
     */
    async downloadInvoicePDF(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const { id } = req.params;

            if (!tenantId) {
                return res.status(400).json({
                    error: 'Tenant ID is required'
                });
            }

            const pdfBuffer = await invoiceService.generateInvoicePDF(id, tenantId);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
            res.send(pdfBuffer);
        } catch (error) {
            logger.error('Failed to generate invoice PDF', {
                invoiceId: req.params.id,
                error: error.message
            });
            next(error);
        }
    }
}

module.exports = new InvoiceController();


