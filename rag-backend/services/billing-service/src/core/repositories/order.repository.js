const { BaseRepository } = require('@rag-platform/database');
const { Order } = require('../../domain/models/order.model');

class OrderRepository extends BaseRepository {
    constructor() {
        super(Order);
    }

    /**
     * Find order by order number
     */
    async findByOrderNumber(orderNumber, tenantId) {
        return this.model.findOne({
            where: { orderNumber, tenantId }
        });
    }

    /**
     * Find order by idempotency key
     */
    async findByIdempotencyKey(idempotencyKey, tenantId) {
        return this.model.findOne({
            where: { idempotencyKey, tenantId }
        });
    }

    /**
     * Find orders by user
     */
    async findByUserId(userId, tenantId, options = {}) {
        return this.model.findAll({
            where: { userId, tenantId },
            order: [['created_at', 'DESC']],
            ...options
        });
    }

    /**
     * Find orders by status
     */
    async findByStatus(status, tenantId, options = {}) {
        return this.model.findAll({
            where: { status, tenantId },
            order: [['created_at', 'DESC']],
            ...options
        });
    }

    /**
     * Update order status
     */
    async updateStatus(orderId, status, tenantId) {
        const order = await this.findById(orderId, tenantId);
        if (!order) {
            return null;
        }
        return order.update({ status });
    }

    /**
     * Generate unique order number
     */
    async generateOrderNumber() {
        const prefix = 'ORD';
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}-${timestamp}-${random}`;
    }
}

module.exports = { OrderRepository };

