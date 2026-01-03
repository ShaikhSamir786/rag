const { InvoiceService } = require('../../../core/services/invoice.service');
const { logger } = require('@rag-platform/logger');

const invoiceService = new InvoiceService();

/**
 * Generate invoice from order
 */
async function generateInvoice(job) {
    const { orderId, tenantId } = job.data;

    logger.info('Generating invoice', {
        orderId,
        tenantId,
        jobId: job.id
    });

    try {
        const invoice = await invoiceService.generateInvoiceFromOrder(orderId, tenantId);

        logger.info('Invoice generated successfully', {
            invoiceId: invoice.id,
            orderId,
            tenantId,
            jobId: job.id
        });

        return { success: true, invoiceId: invoice.id };
    } catch (error) {
        logger.error('Failed to generate invoice', {
            orderId,
            tenantId,
            error: error.message,
            stack: error.stack,
            jobId: job.id
        });

        throw error;
    }
}

module.exports = {
    generateInvoice
};


