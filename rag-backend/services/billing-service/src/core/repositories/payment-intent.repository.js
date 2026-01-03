const { BaseRepository } = require('@rag-platform/database');
const { PaymentIntent } = require('../../domain/models/payment-intent.model');

class PaymentIntentRepository extends BaseRepository {
    constructor() {
        super(PaymentIntent);
    }

    /**
     * Find payment intent by provider payment intent ID
     */
    async findByProviderPaymentIntentId(providerPaymentIntentId, provider, tenantId) {
        return this.model.findOne({
            where: { providerPaymentIntentId, provider, tenantId }
        });
    }

    /**
     * Find payment intents by order
     */
    async findByOrderId(orderId, tenantId, options = {}) {
        return this.model.findAll({
            where: { orderId, tenantId },
            order: [['created_at', 'DESC']],
            ...options
        });
    }

    /**
     * Find payment intents by user
     */
    async findByUserId(userId, tenantId, options = {}) {
        return this.model.findAll({
            where: { userId, tenantId },
            order: [['created_at', 'DESC']],
            ...options
        });
    }

    /**
     * Find payment intents by status
     */
    async findByStatus(status, tenantId, options = {}) {
        return this.model.findAll({
            where: { status, tenantId },
            order: [['created_at', 'DESC']],
            ...options
        });
    }

    /**
     * Update payment intent status
     */
    async updateStatus(paymentIntentId, status, tenantId, additionalData = {}) {
        const paymentIntent = await this.findById(paymentIntentId, tenantId);
        if (!paymentIntent) {
            return null;
        }
        return paymentIntent.update({
            status,
            ...additionalData
        });
    }

    /**
     * Find expired payment intents
     */
    async findExpired(tenantId) {
        return this.model.findAll({
            where: {
                tenantId,
                status: {
                    [require('sequelize').Op.in]: ['requires_payment_method', 'requires_confirmation']
                },
                expiresAt: {
                    [require('sequelize').Op.lt]: new Date()
                }
            }
        });
    }
}

module.exports = { PaymentIntentRepository };

