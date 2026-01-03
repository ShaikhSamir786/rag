const { PaymentService } = require('../../core/services/payment.service');
const { logger } = require('@rag-platform/logger');

const paymentService = new PaymentService();

class PaymentController {
    /**
     * Create payment intent
     */
    async createPaymentIntent(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const userId = req.user?.id || req.body.userId;

            if (!tenantId || !userId) {
                return res.status(400).json({
                    error: 'Tenant ID and User ID are required'
                });
            }

            const paymentIntent = await paymentService.createPaymentIntent({
                ...req.body,
                tenantId,
                userId
            });

            res.status(201).json(paymentIntent);
        } catch (error) {
            logger.error('Failed to create payment intent', {
                error: error.message,
                stack: error.stack
            });
            next(error);
        }
    }

    /**
     * Confirm payment intent
     */
    async confirmPaymentIntent(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const { id } = req.params;

            if (!tenantId) {
                return res.status(400).json({
                    error: 'Tenant ID is required'
                });
            }

            const result = await paymentService.confirmPaymentIntent(
                id,
                tenantId,
                req.body
            );

            res.json(result);
        } catch (error) {
            logger.error('Failed to confirm payment intent', {
                paymentIntentId: req.params.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * Get payment intent
     */
    async getPaymentIntent(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const { id } = req.params;

            if (!tenantId) {
                return res.status(400).json({
                    error: 'Tenant ID is required'
                });
            }

            const paymentIntent = await paymentService.getPaymentIntent(id, tenantId);

            res.json(paymentIntent);
        } catch (error) {
            logger.error('Failed to get payment intent', {
                paymentIntentId: req.params.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * Get payment status
     */
    async getPaymentStatus(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const { id } = req.params;

            if (!tenantId) {
                return res.status(400).json({
                    error: 'Tenant ID is required'
                });
            }

            const status = await paymentService.getPaymentStatus(id, tenantId);

            res.json(status);
        } catch (error) {
            logger.error('Failed to get payment status', {
                paymentIntentId: req.params.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * Cancel payment intent
     */
    async cancelPaymentIntent(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const { id } = req.params;

            if (!tenantId) {
                return res.status(400).json({
                    error: 'Tenant ID is required'
                });
            }

            const result = await paymentService.cancelPaymentIntent(id, tenantId);

            res.json(result);
        } catch (error) {
            logger.error('Failed to cancel payment intent', {
                paymentIntentId: req.params.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * List payments
     */
    async listPayments(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const userId = req.user?.id || req.query.userId;

            if (!tenantId) {
                return res.status(400).json({
                    error: 'Tenant ID is required'
                });
            }

            const payments = await paymentService.listPayments(tenantId, userId, {
                limit: req.query.limit,
                offset: req.query.offset
            });

            res.json({
                data: payments,
                count: payments.length
            });
        } catch (error) {
            logger.error('Failed to list payments', {
                error: error.message
            });
            next(error);
        }
    }
}

module.exports = new PaymentController();



