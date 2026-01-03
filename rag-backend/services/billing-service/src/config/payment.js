const paymentConfig = {
    provider: process.env.PAYMENT_PROVIDER || 'stripe',
    
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        apiVersion: '2024-11-20.acacia',
        timeout: 30000,
        maxNetworkRetries: 2
    },
    
    paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        webhookId: process.env.PAYPAL_WEBHOOK_ID,
        environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
        apiUrl: process.env.PAYPAL_ENVIRONMENT === 'production' 
            ? 'https://api-m.paypal.com' 
            : 'https://api-m.sandbox.paypal.com'
    },
    
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET,
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
    },
    
    // Payment settings
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR'],
    
    // Payment intent settings
    paymentIntentTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    
    // Idempotency settings
    idempotencyKeyHeader: 'Idempotency-Key',
    idempotencyKeyTTL: 24 * 60 * 60 * 1000, // 24 hours
    
    // Webhook settings
    webhookTimeout: 30000, // 30 seconds
    webhookRetryAttempts: 3,
    
    // Refund settings
    maxRefundPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
    
    // Security settings
    requireWebhookSignature: process.env.NODE_ENV === 'production',
    rateLimitWindow: 60 * 1000, // 1 minute
    rateLimitMax: 100 // requests per window
};

// Validate required configuration
function validateConfig() {
    if (paymentConfig.provider === 'stripe') {
        if (!paymentConfig.stripe.secretKey) {
            throw new Error('STRIPE_SECRET_KEY is required');
        }
        if (paymentConfig.requireWebhookSignature && !paymentConfig.stripe.webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET is required in production');
        }
    }
    
    if (paymentConfig.provider === 'paypal') {
        if (!paymentConfig.paypal.clientId || !paymentConfig.paypal.clientSecret) {
            throw new Error('PayPal credentials are required');
        }
    }
    
    if (paymentConfig.provider === 'razorpay') {
        if (!paymentConfig.razorpay.keyId || !paymentConfig.razorpay.keySecret) {
            throw new Error('Razorpay credentials are required');
        }
    }
}

// Only validate in non-test environments
if (process.env.NODE_ENV !== 'test') {
    try {
        validateConfig();
    } catch (error) {
        console.warn(`Payment config validation warning: ${error.message}`);
    }
}

module.exports = paymentConfig;



