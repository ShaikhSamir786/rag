const Stripe = require('stripe');
const { logger } = require('@rag-platform/logger');
const paymentConfig = require('../../config/payment');

class StripeClient {
    constructor() {
        if (!paymentConfig.stripe.secretKey) {
            throw new Error('Stripe secret key is not configured');
        }

        this.stripe = new Stripe(paymentConfig.stripe.secretKey, {
            apiVersion: paymentConfig.stripe.apiVersion,
            timeout: paymentConfig.stripe.timeout,
            maxNetworkRetries: paymentConfig.stripe.maxNetworkRetries,
            typescript: false
        });

        this.logger = logger;
    }

    /**
     * Retry wrapper for Stripe API calls
     */
    async withRetry(operation, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                // Don't retry on client errors (4xx)
                if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
                    throw error;
                }
                
                // Don't retry on certain Stripe errors
                if (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError') {
                    throw error;
                }
                
                if (attempt < maxRetries) {
                    const waitTime = delay * Math.pow(2, attempt - 1); // Exponential backoff
                    this.logger.warn(`Stripe API call failed, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})`, {
                        error: error.message,
                        type: error.type
                    });
                    await this.sleep(waitTime);
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Create a payment intent
     */
    async createPaymentIntent(params) {
        try {
            return await this.withRetry(async () => {
                const paymentIntent = await this.stripe.paymentIntents.create({
                    amount: params.amount,
                    currency: params.currency || paymentConfig.defaultCurrency,
                    payment_method_types: params.paymentMethodTypes || ['card'],
                    description: params.description,
                    metadata: params.metadata || {},
                    customer: params.customerId,
                    receipt_email: params.receiptEmail,
                    ...params.additionalParams
                });

                this.logger.info('Payment intent created', {
                    paymentIntentId: paymentIntent.id,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency
                });

                return paymentIntent;
            });
        } catch (error) {
            this.logger.error('Failed to create payment intent', {
                error: error.message,
                type: error.type,
                code: error.code
            });
            throw this.handleStripeError(error);
        }
    }

    /**
     * Retrieve a payment intent
     */
    async retrievePaymentIntent(paymentIntentId) {
        try {
            return await this.withRetry(async () => {
                return await this.stripe.paymentIntents.retrieve(paymentIntentId);
            });
        } catch (error) {
            this.logger.error('Failed to retrieve payment intent', {
                paymentIntentId,
                error: error.message
            });
            throw this.handleStripeError(error);
        }
    }

    /**
     * Confirm a payment intent
     */
    async confirmPaymentIntent(paymentIntentId, params = {}) {
        try {
            return await this.withRetry(async () => {
                return await this.stripe.paymentIntents.confirm(paymentIntentId, {
                    payment_method: params.paymentMethodId,
                    return_url: params.returnUrl,
                    ...params.additionalParams
                });
            });
        } catch (error) {
            this.logger.error('Failed to confirm payment intent', {
                paymentIntentId,
                error: error.message
            });
            throw this.handleStripeError(error);
        }
    }

    /**
     * Cancel a payment intent
     */
    async cancelPaymentIntent(paymentIntentId) {
        try {
            return await this.withRetry(async () => {
                return await this.stripe.paymentIntents.cancel(paymentIntentId);
            });
        } catch (error) {
            this.logger.error('Failed to cancel payment intent', {
                paymentIntentId,
                error: error.message
            });
            throw this.handleStripeError(error);
        }
    }

    /**
     * Create a refund
     */
    async createRefund(chargeId, params = {}) {
        try {
            return await this.withRetry(async () => {
                const refund = await this.stripe.refunds.create({
                    charge: chargeId,
                    amount: params.amount,
                    reason: params.reason,
                    metadata: params.metadata || {},
                    ...params.additionalParams
                });

                this.logger.info('Refund created', {
                    refundId: refund.id,
                    chargeId,
                    amount: refund.amount
                });

                return refund;
            });
        } catch (error) {
            this.logger.error('Failed to create refund', {
                chargeId,
                error: error.message
            });
            throw this.handleStripeError(error);
        }
    }

    /**
     * Retrieve a refund
     */
    async retrieveRefund(refundId) {
        try {
            return await this.withRetry(async () => {
                return await this.stripe.refunds.retrieve(refundId);
            });
        } catch (error) {
            this.logger.error('Failed to retrieve refund', {
                refundId,
                error: error.message
            });
            throw this.handleStripeError(error);
        }
    }

    /**
     * Create a customer
     */
    async createCustomer(params) {
        try {
            return await this.withRetry(async () => {
                return await this.stripe.customers.create({
                    email: params.email,
                    name: params.name,
                    metadata: params.metadata || {},
                    ...params.additionalParams
                });
            });
        } catch (error) {
            this.logger.error('Failed to create customer', {
                error: error.message
            });
            throw this.handleStripeError(error);
        }
    }

    /**
     * Create a subscription
     */
    async createSubscription(params) {
        try {
            return await this.withRetry(async () => {
                const subscription = await this.stripe.subscriptions.create({
                    customer: params.customerId,
                    items: params.items,
                    payment_behavior: params.paymentBehavior || 'default_incomplete',
                    payment_settings: params.paymentSettings,
                    metadata: params.metadata || {},
                    ...params.additionalParams
                });

                this.logger.info('Subscription created', {
                    subscriptionId: subscription.id,
                    customerId: params.customerId
                });

                return subscription;
            });
        } catch (error) {
            this.logger.error('Failed to create subscription', {
                error: error.message
            });
            throw this.handleStripeError(error);
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload, signature) {
        try {
            const event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                paymentConfig.stripe.webhookSecret
            );
            return event;
        } catch (error) {
            this.logger.error('Webhook signature verification failed', {
                error: error.message
            });
            throw new Error('Invalid webhook signature');
        }
    }

    /**
     * Handle and normalize Stripe errors
     */
    handleStripeError(error) {
        const normalizedError = {
            message: error.message,
            type: error.type,
            code: error.code,
            statusCode: error.statusCode || 500
        };

        // Map Stripe error types to HTTP status codes
        switch (error.type) {
            case 'StripeCardError':
                normalizedError.statusCode = 402; // Payment Required
                break;
            case 'StripeRateLimitError':
                normalizedError.statusCode = 429; // Too Many Requests
                break;
            case 'StripeInvalidRequestError':
                normalizedError.statusCode = 400; // Bad Request
                break;
            case 'StripeAPIError':
                normalizedError.statusCode = 500; // Internal Server Error
                break;
            case 'StripeConnectionError':
                normalizedError.statusCode = 503; // Service Unavailable
                break;
            case 'StripeAuthenticationError':
                normalizedError.statusCode = 401; // Unauthorized
                break;
            default:
                normalizedError.statusCode = 500;
        }

        return normalizedError;
    }

    /**
     * Get Stripe instance (for advanced operations)
     */
    getStripeInstance() {
        return this.stripe;
    }
}

module.exports = { StripeClient };


