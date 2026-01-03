const { logger } = require('@rag-platform/logger');
const { OrderRepository } = require('../repositories/order.repository');
const { NotFoundError } = require('@rag-platform/common').errors;

class OrderService {
    constructor() {
        this.orderRepository = new OrderRepository();
        this.logger = logger;
    }

    /**
     * Create a new order
     */
    async createOrder(data) {
        const { tenantId, userId, amount, currency, paymentType, description, metadata, idempotencyKey } = data;

        // Check if order with same idempotency key exists
        if (idempotencyKey) {
            const existingOrder = await this.orderRepository.findByIdempotencyKey(idempotencyKey, tenantId);
            if (existingOrder) {
                this.logger.info('Order with idempotency key already exists', {
                    orderId: existingOrder.id,
                    idempotencyKey
                });
                return existingOrder;
            }
        }

        // Generate order number
        const orderNumber = await this.orderRepository.generateOrderNumber();

        // Create order
        const order = await this.orderRepository.create({
            orderNumber,
            idempotencyKey: idempotencyKey || `${tenantId}-${userId}-${Date.now()}`,
            amount,
            currency: currency || 'USD',
            paymentType: paymentType || 'one_time',
            description,
            metadata: metadata || {},
            status: 'pending'
        }, tenantId);

        this.logger.info('Order created', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            tenantId,
            userId
        });

        return order;
    }

    /**
     * Get order by ID
     */
    async getOrderById(orderId, tenantId) {
        const order = await this.orderRepository.findById(orderId, tenantId);
        if (!order) {
            throw new NotFoundError('Order not found');
        }
        return order;
    }

    /**
     * Get order by order number
     */
    async getOrderByOrderNumber(orderNumber, tenantId) {
        const order = await this.orderRepository.findByOrderNumber(orderNumber, tenantId);
        if (!order) {
            throw new NotFoundError('Order not found');
        }
        return order;
    }

    /**
     * Get orders by user
     */
    async getOrdersByUser(userId, tenantId, options = {}) {
        return this.orderRepository.findByUserId(userId, tenantId, options);
    }

    /**
     * Get orders by status
     */
    async getOrdersByStatus(status, tenantId, options = {}) {
        return this.orderRepository.findByStatus(status, tenantId, options);
    }

    /**
     * Update order status
     */
    async updateOrderStatus(orderId, status, tenantId) {
        const order = await this.getOrderById(orderId, tenantId);
        
        const updatedOrder = await this.orderRepository.updateStatus(orderId, status, tenantId);
        
        this.logger.info('Order status updated', {
            orderId,
            oldStatus: order.status,
            newStatus: status,
            tenantId
        });

        return updatedOrder;
    }

    /**
     * Cancel an order
     */
    async cancelOrder(orderId, tenantId) {
        const order = await this.getOrderById(orderId, tenantId);

        if (order.status === 'completed') {
            throw new Error('Cannot cancel a completed order');
        }

        if (order.status === 'cancelled') {
            return order;
        }

        return this.updateOrderStatus(orderId, 'cancelled', tenantId);
    }
}

module.exports = { OrderService };


