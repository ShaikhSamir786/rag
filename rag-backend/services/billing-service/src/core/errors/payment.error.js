const { BaseError } = require('@rag-platform/common').errors;

class PaymentError extends BaseError {
    constructor(message, statusCode = 500, code = 'PAYMENT_ERROR') {
        super(code, message, statusCode, true);
        this.name = 'PaymentError';
    }
}

class PaymentIntentError extends PaymentError {
    constructor(message, statusCode = 400, code = 'PAYMENT_INTENT_ERROR') {
        super(message, statusCode, code);
        this.name = 'PaymentIntentError';
    }
}

class PaymentProcessingError extends PaymentError {
    constructor(message, statusCode = 402, code = 'PAYMENT_PROCESSING_ERROR') {
        super(message, statusCode, code);
        this.name = 'PaymentProcessingError';
    }
}

class RefundError extends PaymentError {
    constructor(message, statusCode = 400, code = 'REFUND_ERROR') {
        super(message, statusCode, code);
        this.name = 'RefundError';
    }
}

class WebhookError extends PaymentError {
    constructor(message, statusCode = 400, code = 'WEBHOOK_ERROR') {
        super(message, statusCode, code);
        this.name = 'WebhookError';
    }
}

class IdempotencyError extends PaymentError {
    constructor(message, statusCode = 409, code = 'IDEMPOTENCY_ERROR') {
        super(message, statusCode, code);
        this.name = 'IdempotencyError';
    }
}

module.exports = {
    PaymentError,
    PaymentIntentError,
    PaymentProcessingError,
    RefundError,
    WebhookError,
    IdempotencyError
};


