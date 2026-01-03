const { RefundService } = require('../../core/services/refund.service');
const { logger } = require('@rag-platform/logger');

const refundService = new RefundService();

class RefundController {
    /**
     * Create refund
     */
    async createRefund(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const userId = req.user?.id || req.body.userId;

            if (!tenantId) {
                return res.status(400).json({
                    error: 'Tenant ID is required'
                });
            }

            const refund = await refundService.createRefund({
                ...req.body,
                tenantId,
                userId
            });

            res.status(201).json(refund);
        } catch (error) {
            logger.error('Failed to create refund', {
                error: error.message,
                stack: error.stack
            });
            next(error);
        }
    }

    /**
     * Get refund
     */
    async getRefund(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const { id } = req.params;

            if (!tenantId) {
                return res.status(400).json({
                    error: 'Tenant ID is required'
                });
            }

            const refund = await refundService.getRefund(id, tenantId);

            res.json(refund);
        } catch (error) {
            logger.error('Failed to get refund', {
                refundId: req.params.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * Get refunds by transaction
     */
    async getRefundsByTransaction(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const { transactionId } = req.params;

            if (!tenantId) {
                return res.status(400).json({
                    error: 'Tenant ID is required'
                });
            }

            const refunds = await refundService.getRefundsByTransaction(transactionId, tenantId);

            res.json({
                data: refunds,
                count: refunds.length
            });
        } catch (error) {
            logger.error('Failed to get refunds by transaction', {
                transactionId: req.params.transactionId,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * Get refunds by order
     */
    async getRefundsByOrder(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const { orderId } = req.params;

            if (!tenantId) {
                return res.status(400).json({
                    error: 'Tenant ID is required'
                });
            }

            const refunds = await refundService.getRefundsByOrder(orderId, tenantId);

            res.json({
                data: refunds,
                count: refunds.length
            });
        } catch (error) {
            logger.error('Failed to get refunds by order', {
                orderId: req.params.orderId,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * List refunds
     */
    async listRefunds(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const userId = req.user?.id || req.query.userId;

            if (!tenantId) {
                return res.status(400).json({
                    error: 'Tenant ID is required'
                });
            }

            const refunds = await refundService.getRefundsByUser(userId, tenantId, {
                limit: req.query.limit,
                offset: req.query.offset
            });

            res.json({
                data: refunds,
                count: refunds.length
            });
        } catch (error) {
            logger.error('Failed to list refunds', {
                error: error.message
            });
            next(error);
        }
    }
}

module.exports = new RefundController();



