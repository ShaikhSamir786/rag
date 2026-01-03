const { PaymentService } = require('../../../core/services/payment.service');
const { logger } = require('@rag-platform/logger');

const paymentService = new PaymentService();

/**
 * Update payment status by syncing with provider
 */
async function updatePaymentStatus(job) {
    const { paymentIntentId, tenantId } = job.data;

    logger.info('Updating payment status', {
        paymentIntentId,
        tenantId,
        jobId: job.id
    });

    try {
        // Sync payment intent with provider
        const paymentIntent = await paymentService.getPaymentIntent(paymentIntentId, tenantId);

        logger.info('Payment status updated', {
            paymentIntentId,
            status: paymentIntent.status,
            tenantId,
            jobId: job.id
        });

        return { success: true, paymentIntentId, status: paymentIntent.status };
    } catch (error) {
        logger.error('Failed to update payment status', {
            paymentIntentId,
            tenantId,
            error: error.message,
            stack: error.stack,
            jobId: job.id
        });

        throw error;
    }
}

module.exports = {
    updatePaymentStatus
};



