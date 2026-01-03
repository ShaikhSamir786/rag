const { logger } = require('@rag-platform/logger');
const { StripeStrategy } = require('../strategies/stripe.strategy');
const { RefundRepository } = require('../repositories/refund.repository');
const { TransactionRepository } = require('../repositories/transaction.repository');
const { OrderRepository } = require('../repositories/order.repository');
const { RefundError } = require('../errors/payment.error');
const { NotFoundError } = require('@rag-platform/common').errors;
const paymentConfig = require('../../config/payment');

class RefundService {
    constructor() {
        this.stripeStrategy = new StripeStrategy();
        this.refundRepository = new RefundRepository();
        this.transactionRepository = new TransactionRepository();
        this.orderRepository = new OrderRepository();
        this.logger = logger;
    }

    /**
     * Create a refund
     */
    async createRefund(data) {
        const { tenantId, transactionId, amount, reason, reasonDescription, userId } = data;

        // Get transaction
        const transaction = await this.transactionRepository.findById(transactionId, tenantId);
        if (!transaction) {
            throw new NotFoundError('Transaction not found');
        }

        // Validate transaction status
        if (transaction.status !== 'succeeded') {
            throw new RefundError('Can only refund succeeded transactions');
        }

        // Check if transaction is within refund period
        const transactionAge = Date.now() - new Date(transaction.createdAt).getTime();
        if (transactionAge > paymentConfig.maxRefundPeriod) {
            throw new RefundError('Transaction is outside the refund period');
        }

        // Calculate refund amount
        const refundAmount = amount || transaction.amount;

        // Validate refund amount
        if (refundAmount <= 0) {
            throw new RefundError('Refund amount must be greater than 0');
        }

        if (refundAmount > transaction.amount) {
            throw new RefundError('Refund amount cannot exceed transaction amount');
        }

        // Check existing refunds
        const totalRefunded = await this.refundRepository.getTotalRefundedAmount(transactionId, tenantId);
        const remainingAmount = transaction.amount - totalRefunded;

        if (refundAmount > remainingAmount) {
            throw new RefundError(`Refund amount exceeds remaining refundable amount: ${remainingAmount}`);
        }

        // Get charge ID from transaction
        const chargeId = transaction.providerTransactionId;
        if (!chargeId) {
            throw new RefundError('Transaction does not have a provider transaction ID');
        }

        // Create refund with Stripe
        let stripeRefund;
        try {
            stripeRefund = await this.stripeStrategy.createRefund(chargeId, {
                amount: refundAmount,
                reason: reason || 'requested_by_customer',
                transactionId,
                orderId: transaction.orderId,
                userId: transaction.userId,
                tenantId,
                metadata: {
                    reasonDescription
                }
            });
        } catch (error) {
            this.logger.error('Failed to create refund with Stripe', {
                transactionId,
                chargeId,
                error: error.message
            });
            throw new RefundError(`Failed to create refund: ${error.message}`);
        }

        // Create refund record
        const refund = await this.refundRepository.create({
            transactionId,
            orderId: transaction.orderId,
            userId: transaction.userId || userId,
            provider: 'stripe',
            providerRefundId: stripeRefund.id,
            amount: refundAmount,
            currency: transaction.currency,
            status: stripeRefund.status,
            reason: reason || 'requested_by_customer',
            reasonDescription,
            metadata: stripeRefund.metadata
        }, tenantId);

        // Update transaction status if fully refunded
        const newTotalRefunded = totalRefunded + refundAmount;
        if (newTotalRefunded >= transaction.amount) {
            await this.transactionRepository.updateStatus(
                transactionId,
                'refunded',
                tenantId
            );
        } else {
            await this.transactionRepository.updateStatus(
                transactionId,
                'partially_refunded',
                tenantId
            );
        }

        this.logger.info('Refund created', {
            refundId: refund.id,
            transactionId,
            amount: refundAmount,
            status: refund.status
        });

        return refund;
    }

    /**
     * Get refund by ID
     */
    async getRefund(refundId, tenantId) {
        const refund = await this.refundRepository.findById(refundId, tenantId);
        if (!refund) {
            throw new NotFoundError('Refund not found');
        }
        return refund;
    }

    /**
     * Get refunds by transaction
     */
    async getRefundsByTransaction(transactionId, tenantId) {
        return this.refundRepository.findByTransactionId(transactionId, tenantId);
    }

    /**
     * Get refunds by order
     */
    async getRefundsByOrder(orderId, tenantId) {
        return this.refundRepository.findByOrderId(orderId, tenantId);
    }

    /**
     * Get refunds by user
     */
    async getRefundsByUser(userId, tenantId, options = {}) {
        return this.refundRepository.findByUserId(userId, tenantId, options);
    }

    /**
     * Update refund status (called by webhook)
     */
    async updateRefundStatus(providerRefundId, status, provider, tenantId) {
        const refund = await this.refundRepository.findByProviderRefundId(
            providerRefundId,
            provider,
            tenantId
        );

        if (!refund) {
            this.logger.warn('Refund not found for status update', {
                providerRefundId,
                provider
            });
            return null;
        }

        return this.refundRepository.updateStatus(
            refund.id,
            status,
            tenantId,
            {
                processedAt: status === 'succeeded' || status === 'failed' ? new Date() : refund.processedAt
            }
        );
    }
}

module.exports = { RefundService };

