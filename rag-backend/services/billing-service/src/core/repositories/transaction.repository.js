const { BaseRepository } = require('@rag-platform/database');
const { Transaction } = require('../../domain/models/transaction.model');

class TransactionRepository extends BaseRepository {
    constructor() {
        super(Transaction);
    }

    /**
     * Find transaction by provider transaction ID
     */
    async findByProviderTransactionId(providerTransactionId, provider, tenantId) {
        return this.model.findOne({
            where: { providerTransactionId, provider, tenantId }
        });
    }

    /**
     * Find transactions by order
     */
    async findByOrderId(orderId, tenantId, options = {}) {
        return this.model.findAll({
            where: { orderId, tenantId },
            order: [['created_at', 'DESC']],
            ...options
        });
    }

    /**
     * Find transactions by user
     */
    async findByUserId(userId, tenantId, options = {}) {
        return this.model.findAll({
            where: { userId, tenantId },
            order: [['created_at', 'DESC']],
            ...options
        });
    }

    /**
     * Find transactions by status
     */
    async findByStatus(status, tenantId, options = {}) {
        return this.model.findAll({
            where: { status, tenantId },
            order: [['created_at', 'DESC']],
            ...options
        });
    }

    /**
     * Update transaction status
     */
    async updateStatus(transactionId, status, tenantId, additionalData = {}) {
        const transaction = await this.findById(transactionId, tenantId);
        if (!transaction) {
            return null;
        }
        return transaction.update({
            status,
            processedAt: status === 'succeeded' || status === 'failed' ? new Date() : transaction.processedAt,
            ...additionalData
        });
    }

    /**
     * Find transactions by payment intent
     */
    async findByPaymentIntentId(paymentIntentId, tenantId) {
        return this.model.findAll({
            where: { paymentIntentId, tenantId },
            order: [['created_at', 'DESC']]
        });
    }
}

module.exports = { TransactionRepository };



