const { logger } = require('@rag-platform/logger');
const { StripeStrategy } = require('../strategies/stripe.strategy');
const { OrderService } = require('./order.service');
const { OrderRepository } = require('../repositories/order.repository');
const { TransactionRepository } = require('../repositories/transaction.repository');
const { PaymentIntentRepository } = require('../repositories/payment-intent.repository');
const { IdempotencyService } = require('./idempotency.service');
const { PaymentIntentError, PaymentProcessingError } = require('../errors/payment.error');
const { NotFoundError } = require('@rag-platform/common').errors;
const paymentConfig = require('../../config/payment');

class PaymentService {
    constructor() {
        this.stripeStrategy = new StripeStrategy();
        this.orderService = new OrderService();
        this.orderRepository = new OrderRepository();
        this.transactionRepository = new TransactionRepository();
        this.paymentIntentRepository = new PaymentIntentRepository();
        this.idempotencyService = new IdempotencyService();
        this.logger = logger;
    }

    /**
     * Create a payment intent
     */
    async createPaymentIntent(data) {
        const { tenantId, userId, amount, currency, paymentType, description, metadata, idempotencyKey, customerId, receiptEmail } = data;

        // Validate amount
        if (!amount || amount <= 0) {
            throw new PaymentIntentError('Amount must be greater than 0');
        }

        // Process with idempotency
        const idempotencyKeyToUse = idempotencyKey || this.idempotencyService.generateKey(tenantId, userId, 'create_payment_intent', { amount, currency });
        
        return this.idempotencyService.processWithIdempotency(
            idempotencyKeyToUse,
            tenantId,
            async () => {
                // Create order first
                const order = await this.orderService.createOrder({
                    tenantId,
                    userId,
                    amount,
                    currency,
                    paymentType: paymentType || 'one_time',
                    description,
                    metadata,
                    idempotencyKey: idempotencyKeyToUse
                });

                // Create payment intent with Stripe
                const stripePaymentIntent = await this.stripeStrategy.createPaymentIntent({
                    orderId: order.id,
                    userId,
                    tenantId,
                    amount,
                    currency: currency || paymentConfig.defaultCurrency,
                    description,
                    metadata: {
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        ...metadata
                    },
                    customerId,
                    receiptEmail
                });

                // Store payment intent in database
                const paymentIntent = await this.paymentIntentRepository.create({
                    orderId: order.id,
                    userId,
                    provider: 'stripe',
                    providerPaymentIntentId: stripePaymentIntent.id,
                    clientSecret: stripePaymentIntent.clientSecret,
                    amount,
                    currency: currency || paymentConfig.defaultCurrency,
                    status: stripePaymentIntent.status,
                    paymentMethodTypes: ['card'],
                    metadata: stripePaymentIntent.metadata,
                    expiresAt: new Date(Date.now() + paymentConfig.paymentIntentTimeout)
                }, tenantId);

                // Update order status
                await this.orderService.updateOrderStatus(order.id, 'processing', tenantId);

                this.logger.info('Payment intent created', {
                    paymentIntentId: paymentIntent.id,
                    orderId: order.id,
                    amount,
                    currency
                });

                return {
                    id: paymentIntent.id,
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    clientSecret: paymentIntent.clientSecret,
                    status: paymentIntent.status,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency
                };
            }
        );
    }

    /**
     * Confirm a payment intent
     */
    async confirmPaymentIntent(paymentIntentId, tenantId, params = {}) {
        const paymentIntent = await this.paymentIntentRepository.findById(paymentIntentId, tenantId);
        if (!paymentIntent) {
            throw new NotFoundError('Payment intent not found');
        }

        try {
            // Confirm with Stripe
            const confirmedIntent = await this.stripeStrategy.confirmPaymentIntent(
                paymentIntent.providerPaymentIntentId,
                params
            );

            // Update payment intent status
            await this.paymentIntentRepository.updateStatus(
                paymentIntentId,
                confirmedIntent.status,
                tenantId
            );

            // Create transaction if payment succeeded
            if (confirmedIntent.status === 'succeeded') {
                await this.createTransactionFromPaymentIntent(paymentIntent, tenantId);
            }

            return {
                id: paymentIntent.id,
                status: confirmedIntent.status,
                amount: confirmedIntent.amount
            };
        } catch (error) {
            this.logger.error('Failed to confirm payment intent', {
                paymentIntentId,
                error: error.message
            });
            throw new PaymentProcessingError(`Failed to confirm payment: ${error.message}`);
        }
    }

    /**
     * Get payment intent by ID
     */
    async getPaymentIntent(paymentIntentId, tenantId) {
        const paymentIntent = await this.paymentIntentRepository.findById(paymentIntentId, tenantId);
        if (!paymentIntent) {
            throw new NotFoundError('Payment intent not found');
        }

        // Sync with Stripe to get latest status
        try {
            const stripeIntent = await this.stripeStrategy.retrievePaymentIntent(
                paymentIntent.providerPaymentIntentId
            );

            // Update if status changed
            if (stripeIntent.status !== paymentIntent.status) {
                await this.paymentIntentRepository.updateStatus(
                    paymentIntentId,
                    stripeIntent.status,
                    tenantId
                );
                paymentIntent.status = stripeIntent.status;
            }
        } catch (error) {
            this.logger.warn('Failed to sync payment intent with Stripe', {
                paymentIntentId,
                error: error.message
            });
        }

        return paymentIntent;
    }

    /**
     * Cancel a payment intent
     */
    async cancelPaymentIntent(paymentIntentId, tenantId) {
        const paymentIntent = await this.paymentIntentRepository.findById(paymentIntentId, tenantId);
        if (!paymentIntent) {
            throw new NotFoundError('Payment intent not found');
        }

        try {
            await this.stripeStrategy.cancelPaymentIntent(paymentIntent.providerPaymentIntentId);
            
            await this.paymentIntentRepository.updateStatus(
                paymentIntentId,
                'canceled',
                tenantId
            );

            await this.orderService.updateOrderStatus(paymentIntent.orderId, 'cancelled', tenantId);

            return {
                id: paymentIntent.id,
                status: 'canceled'
            };
        } catch (error) {
            this.logger.error('Failed to cancel payment intent', {
                paymentIntentId,
                error: error.message
            });
            throw new PaymentProcessingError(`Failed to cancel payment: ${error.message}`);
        }
    }

    /**
     * Create transaction from payment intent
     */
    async createTransactionFromPaymentIntent(paymentIntent, tenantId) {
        const order = await this.orderRepository.findById(paymentIntent.orderId, tenantId);
        if (!order) {
            throw new NotFoundError('Order not found');
        }

        // Check if transaction already exists
        const existingTransaction = await this.transactionRepository.model.findOne({
            where: {
                paymentIntentId: paymentIntent.id,
                tenantId
            }
        });

        if (existingTransaction) {
            return existingTransaction;
        }

        // Create transaction
        const transaction = await this.transactionRepository.create({
            orderId: order.id,
            userId: paymentIntent.userId,
            paymentIntentId: paymentIntent.id,
            provider: 'stripe',
            providerTransactionId: paymentIntent.providerPaymentIntentId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'succeeded',
            metadata: paymentIntent.metadata,
            processedAt: new Date()
        }, tenantId);

        // Update order status
        await this.orderService.updateOrderStatus(order.id, 'completed', tenantId);

        this.logger.info('Transaction created from payment intent', {
            transactionId: transaction.id,
            orderId: order.id,
            amount: transaction.amount
        });

        return transaction;
    }

    /**
     * Get payment status
     */
    async getPaymentStatus(paymentIntentId, tenantId) {
        const paymentIntent = await this.getPaymentIntent(paymentIntentId, tenantId);
        const order = await this.orderRepository.findById(paymentIntent.orderId, tenantId);
        
        return {
            paymentIntent: {
                id: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency
            },
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status
            }
        };
    }

    /**
     * List payments
     */
    async listPayments(tenantId, userId, options = {}) {
        const paymentIntents = await this.paymentIntentRepository.findAll(tenantId, {
            where: userId ? { userId } : {},
            limit: options.limit || 20,
            offset: options.offset || 0,
            order: [['created_at', 'DESC']]
        });

        return paymentIntents;
    }
}

module.exports = { PaymentService };

