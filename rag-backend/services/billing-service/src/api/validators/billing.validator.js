const Joi = require('joi');

const createPaymentIntentSchema = Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).uppercase().default('USD'),
    paymentType: Joi.string().valid('one_time', 'subscription').default('one_time'),
    description: Joi.string().max(500).optional(),
    metadata: Joi.object().optional(),
    idempotencyKey: Joi.string().min(8).max(255).optional(),
    customerId: Joi.string().optional(),
    receiptEmail: Joi.string().email().optional()
});

const confirmPaymentIntentSchema = Joi.object({
    paymentMethodId: Joi.string().optional(),
    returnUrl: Joi.string().uri().optional()
});

const createRefundSchema = Joi.object({
    transactionId: Joi.string().uuid().required(),
    amount: Joi.number().positive().optional(),
    reason: Joi.string().valid('duplicate', 'fraudulent', 'requested_by_customer', 'other').optional(),
    reasonDescription: Joi.string().max(500).optional()
});

const createOrderSchema = Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).uppercase().default('USD'),
    paymentType: Joi.string().valid('one_time', 'subscription').default('one_time'),
    description: Joi.string().max(500).optional(),
    metadata: Joi.object().optional(),
    idempotencyKey: Joi.string().min(8).max(255).optional()
});

const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        req.body = value;
        next();
    };
};

const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        req.params = value;
        next();
    };
};

const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        req.query = value;
        next();
    };
};

const idParamSchema = Joi.object({
    id: Joi.string().uuid().required()
});

const listQuerySchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0),
    status: Joi.string().optional()
});

module.exports = {
    validateCreatePaymentIntent: validate(createPaymentIntentSchema),
    validateConfirmPaymentIntent: validate(confirmPaymentIntentSchema),
    validateCreateRefund: validate(createRefundSchema),
    validateCreateOrder: validate(createOrderSchema),
    validateIdParam: validateParams(idParamSchema),
    validateListQuery: validateQuery(listQuerySchema)
};

