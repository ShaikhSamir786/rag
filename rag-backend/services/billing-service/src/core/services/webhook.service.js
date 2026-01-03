const { logger } = require('@rag-platform/logger');
const { StripeStrategy } = require('../strategies/stripe.strategy');
const { WebhookEventRepository } = require('../repositories/webhook-event.repository');
const { PaymentIntentRepository } = require('../repositories/payment-intent.repository');
const { TransactionRepository } = require('../repositories/transaction.repository');
const { OrderRepository } = require('../repositories/order.repository');
const { WebhookError } = require('../errors/payment.error');
const paymentConfig = require('../../config/payment');

class WebhookService {
    constructor() {
        this.stripeStrategy = new StripeStrategy();
        this.webhookEventRepository = new WebhookEventRepository();
        this.paymentIntentRepository = new PaymentIntentRepository();
        this.transactionRepository = new TransactionRepository();
        this.orderRepository = new OrderRepository();
        this.logger = logger;
    }

    /**
     * Verify and process webhook event
     */
    async processWebhookEvent(provider, payload, signature, tenantId) {
        let event;

        // Verify signature
        if (provider === 'stripe') {
            try {
                event = this.stripeStrategy.verifyWebhookSignature(payload, signature);
            } catch (error) {
                this.logger.error('Webhook signature verification failed', {
                    provider,
                    error: error.message
                });
                throw new WebhookError('Invalid webhook signature');
            }
        } else {
            throw new WebhookError(`Unsupported provider: ${provider}`);
        }

        // Check if event already processed
        const eventExists = await this.webhookEventRepository.exists(
            event.id,
            provider,
            tenantId
        );

        if (eventExists) {
            this.logger.info('Webhook event already processed', {
                eventId: event.id,
                eventType: event.type
            });
            return { processed: true, duplicate: true };
        }

        // Store webhook event
        const webhookEvent = await this.webhookEventRepository.create({
            provider,
            eventId: event.id,
            eventType: event.type,
            payload: event.data || event,
            processed: false
        }, tenantId);

        // Process event asynchronously (will be handled by queue worker)
        this.logger.info('Webhook event stored for processing', {
            eventId: event.id,
            eventType: event.type,
            webhookEventId: webhookEvent.id
        });

        return {
            processed: false,
            webhookEventId: webhookEvent.id,
            eventId: event.id,
            eventType: event.type
        };
    }

    /**
     * Process stored webhook event
     */
    async processStoredWebhookEvent(webhookEventId, tenantId) {
        const webhookEvent = await this.webhookEventRepository.findById(webhookEventId, tenantId);
        if (!webhookEvent) {
            throw new Error('Webhook event not found');
        }

        if (webhookEvent.processed) {
            this.logger.info('Webhook event already processed', {
                webhookEventId,
                eventId: webhookEvent.eventId
            });
            return;
        }

        try {
            await this.handleWebhookEvent(webhookEvent);

            // Mark as processed
            await this.webhookEventRepository.markAsProcessed(
                webhookEvent.eventId,
                webhookEvent.provider,
                tenantId
            );

            this.logger.info('Webhook event processed successfully', {
                webhookEventId,
                eventId: webhookEvent.eventId,
                eventType: webhookEvent.eventType
            });
        } catch (error) {
            // Mark as processed with error
            await this.webhookEventRepository.markAsProcessed(
                webhookEvent.eventId,
                webhookEvent.provider,
                tenantId,
                error.message
            );

            this.logger.error('Failed to process webhook event', {
                webhookEventId,
                eventId: webhookEvent.eventId,
                error: error.message
            });

            throw error;
        }
    }

    /**
     * Handle webhook event based on type
     */
    async handleWebhookEvent(webhookEvent) {
        const { eventType, payload, provider } = webhookEvent;

        this.logger.info('Processing webhook event', {
            eventType,
            provider,
            eventId: webhookEvent.eventId
        });

        switch (eventType) {
            case 'payment_intent.succeeded':
                await this.handlePaymentIntentSucceeded(payload);
                break;
            case 'payment_intent.payment_failed':
                await this.handlePaymentIntentFailed(payload);
                break;
            case 'payment_intent.canceled':
                await this.handlePaymentIntentCanceled(payload);
                break;
            case 'charge.refunded':
                await this.handleChargeRefunded(payload);
                break;
            case 'charge.refund.updated':
                await this.handleRefundUpdated(payload);
                break;
            default:
                this.logger.info('Unhandled webhook event type', {
                    eventType,
                    eventId: webhookEvent.eventId
                });
        }
    }

    /**
     * Handle payment intent succeeded
     */
    async handlePaymentIntentSucceeded(payload) {
        const paymentIntentData = payload.object;
        const providerPaymentIntentId = paymentIntentData.id;

        // Find payment intent in database
        const paymentIntent = await this.paymentIntentRepository.findByProviderPaymentIntentId(
            providerPaymentIntentId,
            'stripe',
            payload.metadata?.tenantId || null
        );

        if (!paymentIntent) {
            this.logger.warn('Payment intent not found for webhook event', {
                providerPaymentIntentId
            });
            return;
        }

        // Update payment intent status
        await this.paymentIntentRepository.updateStatus(
            paymentIntent.id,
            'succeeded',
            paymentIntent.tenantId
        );

        // Create transaction
        const order = await this.orderRepository.findById(paymentIntent.orderId, paymentIntent.tenantId);
        if (order) {
            const existingTransaction = await this.transactionRepository.model.findOne({
                where: {
                    paymentIntentId: paymentIntent.id,
                    tenantId: paymentIntent.tenantId
                }
            });

            if (!existingTransaction) {
                await this.transactionRepository.create({
                    orderId: order.id,
                    userId: paymentIntent.userId,
                    paymentIntentId: paymentIntent.id,
                    provider: 'stripe',
                    providerTransactionId: paymentIntentData.latest_charge || providerPaymentIntentId,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                    status: 'succeeded',
                    metadata: paymentIntent.metadata,
                    processedAt: new Date()
                }, paymentIntent.tenantId);

                // Update order status
                await this.orderRepository.updateStatus(order.id, 'completed', paymentIntent.tenantId);
            }
        }

        this.logger.info('Payment intent succeeded event processed', {
            paymentIntentId: paymentIntent.id,
            providerPaymentIntentId
        });
    }

    /**
     * Handle payment intent failed
     */
    async handlePaymentIntentFailed(payload) {
        const paymentIntentData = payload.object;
        const providerPaymentIntentId = paymentIntentData.id;

        const paymentIntent = await this.paymentIntentRepository.findByProviderPaymentIntentId(
            providerPaymentIntentId,
            'stripe',
            payload.metadata?.tenantId || null
        );

        if (!paymentIntent) {
            return;
        }

        await this.paymentIntentRepository.updateStatus(
            paymentIntent.id,
            'canceled',
            paymentIntent.tenantId,
            {
                metadata: {
                    ...paymentIntent.metadata,
                    failureReason: paymentIntentData.last_payment_error?.message,
                    failureCode: paymentIntentData.last_payment_error?.code
                }
            }
        );

        await this.orderRepository.updateStatus(
            paymentIntent.orderId,
            'failed',
            paymentIntent.tenantId
        );

        this.logger.info('Payment intent failed event processed', {
            paymentIntentId: paymentIntent.id
        });
    }

    /**
     * Handle payment intent canceled
     */
    async handlePaymentIntentCanceled(payload) {
        const paymentIntentData = payload.object;
        const providerPaymentIntentId = paymentIntentData.id;

        const paymentIntent = await this.paymentIntentRepository.findByProviderPaymentIntentId(
            providerPaymentIntentId,
            'stripe',
            payload.metadata?.tenantId || null
        );

        if (!paymentIntent) {
            return;
        }

        await this.paymentIntentRepository.updateStatus(
            paymentIntent.id,
            'canceled',
            paymentIntent.tenantId
        );

        await this.orderRepository.updateStatus(
            paymentIntent.orderId,
            'cancelled',
            paymentIntent.tenantId
        );
    }

    /**
     * Handle charge refunded
     */
    async handleChargeRefunded(payload) {
        // This will be handled by refund service
        this.logger.info('Charge refunded event received', {
            chargeId: payload.object.id
        });
    }

    /**
     * Handle refund updated
     */
    async handleRefundUpdated(payload) {
        // This will be handled by refund service
        this.logger.info('Refund updated event received', {
            refundId: payload.object.id
        });
    }
}

module.exports = { WebhookService };


