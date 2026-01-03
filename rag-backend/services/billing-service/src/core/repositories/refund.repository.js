const { BaseRepository } = require('@rag-platform/database');
const { Refund } = require('../../domain/models/refund.model');

class RefundRepository extends BaseRepository {
    constructor() {
        super(Refund);
    }

    /**
     * Find refund by provider refund ID
     */
    async findByProviderRefundId(providerRefundId, provider, tenantId) {
        return this.model.findOne({
            where: { providerRefundId, provider, tenantId }
        });
    }

    /**
     * Find refunds by transaction
     */
    async findByTransactionId(transactionId, tenantId, options = {}) {
        return this.model.findAll({
            where: { transactionId, tenantId },
            order: [['created_at', 'DESC']],
            ...options
        });
    }

    /**
     * Find refunds by order
     */
    async findByOrderId(orderId, tenantId, options = {}) {
        return this.model.findAll({
            where: { orderId, tenantId },
            order: [['created_at', 'DESC']],
            ...options
        });
    }

    /**
     * Find refunds by user
     */
    async findByUserId(userId, tenantId, options = {}) {
        return this.model.findAll({
            where: { userId, tenantId },
            order: [['created_at', 'DESC']],
            ...options
        });
    }

    /**
     * Find refunds by status
     */
    async findByStatus(status, tenantId, options = {}) {
        return this.model.findAll({
            where: { status, tenantId },
            order: [['created_at', 'DESC']],
            ...options
        });
    }

    /**
     * Update refund status
     */
    async updateStatus(refundId, status, tenantId, additionalData = {}) {
        const refund = await this.findById(refundId, tenantId);
        if (!refund) {
            return null;
        }
        return refund.update({
            status,
            processedAt: status === 'succeeded' || status === 'failed' ? new Date() : refund.processedAt,
            ...additionalData
        });
    }

    /**
     * Calculate total refunded amount for a transaction
     */
    async getTotalRefundedAmount(transactionId, tenantId) {
        const result = await this.model.sum('amount', {
            where: {
                transactionId,
                tenantId,
                status: 'succeeded'
            }
        });
        return result || 0;
    }
}

module.exports = { RefundRepository };


