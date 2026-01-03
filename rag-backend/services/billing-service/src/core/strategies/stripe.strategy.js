const { StripeClient } = require('../../infrastructure/payment-providers/stripe.client');
const { logger } = require('@rag-platform/logger');

class StripeStrategy {
    constructor() {
        this.client = new StripeClient();
        this.logger = logger;
    }

    /**
     * Create a payment intent
     */
    async createPaymentIntent(params) {
        try {
            const paymentIntent = await this.client.createPaymentIntent({
                amount: Math.round(params.amount * 100), // Convert to cents
                currency: params.currency || 'USD',
                paymentMethodTypes: params.paymentMethodTypes || ['card'],
                description: params.description,
                metadata: {
                    orderId: params.orderId,
                    userId: params.userId,
                    tenantId: params.tenantId,
                    ...params.metadata
                },
                customer: params.customerId,
                receiptEmail: params.receiptEmail
            });

            return {
                id: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                status: paymentIntent.status,
                amount: paymentIntent.amount / 100, // Convert back from cents
                currency: paymentIntent.currency,
                metadata: paymentIntent.metadata
            };
        } catch (error) {
            this.logger.error('Stripe strategy: Failed to create payment intent', {
                error: error.message,
                params
            });
            throw error;
        }
    }

    /**
     * Retrieve a payment intent
     */
    async retrievePaymentIntent(paymentIntentId) {
        try {
            const paymentIntent = await this.client.retrievePaymentIntent(paymentIntentId);
            
            return {
                id: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                status: paymentIntent.status,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                metadata: paymentIntent.metadata,
                lastPaymentError: paymentIntent.last_payment_error
            };
        } catch (error) {
            this.logger.error('Stripe strategy: Failed to retrieve payment intent', {
                paymentIntentId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Confirm a payment intent
     */
    async confirmPaymentIntent(paymentIntentId, params = {}) {
        try {
            const paymentIntent = await this.client.confirmPaymentIntent(paymentIntentId, {
                paymentMethodId: params.paymentMethodId,
                returnUrl: params.returnUrl
            });

            return {
                id: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency
            };
        } catch (error) {
            this.logger.error('Stripe strategy: Failed to confirm payment intent', {
                paymentIntentId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Cancel a payment intent
     */
    async cancelPaymentIntent(paymentIntentId) {
        try {
            const paymentIntent = await this.client.cancelPaymentIntent(paymentIntentId);
            
            return {
                id: paymentIntent.id,
                status: paymentIntent.status
            };
        } catch (error) {
            this.logger.error('Stripe strategy: Failed to cancel payment intent', {
                paymentIntentId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Create a refund
     */
    async createRefund(chargeId, params = {}) {
        try {
            const refund = await this.client.createRefund(chargeId, {
                amount: params.amount ? Math.round(params.amount * 100) : undefined,
                reason: params.reason,
                metadata: {
                    transactionId: params.transactionId,
                    orderId: params.orderId,
                    userId: params.userId,
                    tenantId: params.tenantId,
                    ...params.metadata
                }
            });

            return {
                id: refund.id,
                status: refund.status,
                amount: refund.amount / 100,
                currency: refund.currency,
                reason: refund.reason,
                metadata: refund.metadata
            };
        } catch (error) {
            this.logger.error('Stripe strategy: Failed to create refund', {
                chargeId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Retrieve a refund
     */
    async retrieveRefund(refundId) {
        try {
            const refund = await this.client.retrieveRefund(refundId);
            
            return {
                id: refund.id,
                status: refund.status,
                amount: refund.amount / 100,
                currency: refund.currency,
                reason: refund.reason
            };
        } catch (error) {
            this.logger.error('Stripe strategy: Failed to retrieve refund', {
                refundId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Create a customer
     */
    async createCustomer(params) {
        try {
            const customer = await this.client.createCustomer({
                email: params.email,
                name: params.name,
                metadata: {
                    userId: params.userId,
                    tenantId: params.tenantId,
                    ...params.metadata
                }
            });

            return {
                id: customer.id,
                email: customer.email,
                metadata: customer.metadata
            };
        } catch (error) {
            this.logger.error('Stripe strategy: Failed to create customer', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Create a subscription
     */
    async createSubscription(params) {
        try {
            const subscription = await this.client.createSubscription({
                customerId: params.customerId,
                items: params.items.map(item => ({
                    price: item.priceId,
                    quantity: item.quantity
                })),
                paymentBehavior: params.paymentBehavior || 'default_incomplete',
                metadata: {
                    userId: params.userId,
                    tenantId: params.tenantId,
                    planId: params.planId,
                    ...params.metadata
                }
            });

            return {
                id: subscription.id,
                status: subscription.status,
                customerId: subscription.customer,
                currentPeriodStart: subscription.current_period_start,
                currentPeriodEnd: subscription.current_period_end,
                latestInvoice: subscription.latest_invoice
            };
        } catch (error) {
            this.logger.error('Stripe strategy: Failed to create subscription', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload, signature) {
        try {
            return this.client.verifyWebhookSignature(payload, signature);
        } catch (error) {
            this.logger.error('Stripe strategy: Webhook signature verification failed', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Map Stripe payment intent status to our internal status
     */
    mapPaymentIntentStatus(stripeStatus) {
        const statusMap = {
            'requires_payment_method': 'pending',
            'requires_confirmation': 'pending',
            'requires_action': 'processing',
            'processing': 'processing',
            'requires_capture': 'processing',
            'succeeded': 'succeeded',
            'canceled': 'failed'
        };

        return statusMap[stripeStatus] || 'pending';
    }

    /**
     * Map Stripe refund status to our internal status
     */
    mapRefundStatus(stripeStatus) {
        const statusMap = {
            'pending': 'pending',
            'succeeded': 'succeeded',
            'failed': 'failed',
            'canceled': 'canceled'
        };

        return statusMap[stripeStatus] || 'pending';
    }
}

module.exports = { StripeStrategy };


