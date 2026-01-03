const { logger } = require('@rag-platform/logger');
const { IdempotencyService } = require('../services/idempotency.service');
const paymentConfig = require('../../config/payment');

const idempotencyService = new IdempotencyService();

/**
 * Middleware to extract and validate idempotency key
 */
const idempotencyMiddleware = (req, res, next) => {
    const idempotencyKey = req.headers[paymentConfig.idempotencyKeyHeader.toLowerCase()] ||
                          req.headers['idempotency-key'] ||
                          req.body?.idempotencyKey;

    if (idempotencyKey) {
        try {
            idempotencyService.validateIdempotencyKey(idempotencyKey);
            req.idempotencyKey = idempotencyKey;
        } catch (error) {
            return res.status(400).json({
                error: 'Invalid idempotency key',
                message: error.message
            });
        }
    }

    next();
};

/**
 * Middleware to check idempotency and return cached response if exists
 */
const checkIdempotency = async (req, res, next) => {
    if (!req.idempotencyKey) {
        return next();
    }

    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
    if (!tenantId) {
        return next();
    }

    try {
        const cachedResponse = await idempotencyService.checkIdempotency(
            req.idempotencyKey,
            tenantId
        );

        if (cachedResponse) {
            logger.info('Returning cached response for idempotency key', {
                idempotencyKey: req.idempotencyKey,
                tenantId
            });
            return res.status(200).json(cachedResponse);
        }
    } catch (error) {
        logger.error('Error checking idempotency', {
            error: error.message,
            idempotencyKey: req.idempotencyKey
        });
    }

    next();
};

module.exports = {
    idempotencyMiddleware,
    checkIdempotency
};



