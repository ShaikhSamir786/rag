const { logger } = require('@rag-platform/logger');
const { IdempotencyError } = require('../errors/payment.error');
const paymentConfig = require('../../config/payment');
const crypto = require('crypto');

class IdempotencyService {
    constructor() {
        this.cache = new Map(); // In-memory cache for idempotency keys
        this.logger = logger;
        this.ttl = paymentConfig.idempotencyKeyTTL;
        
        // Clean up expired keys periodically
        setInterval(() => this.cleanupExpiredKeys(), 60 * 60 * 1000); // Every hour
    }

    /**
     * Generate idempotency key from request
     */
    generateKey(tenantId, userId, operation, data) {
        const keyData = JSON.stringify({
            tenantId,
            userId,
            operation,
            data
        });
        return crypto.createHash('sha256').update(keyData).digest('hex');
    }

    /**
     * Check if idempotency key exists and return cached response
     */
    async checkIdempotency(idempotencyKey, tenantId) {
        const cacheKey = `${tenantId}:${idempotencyKey}`;
        const cached = this.cache.get(cacheKey);

        if (cached) {
            // Check if expired
            if (Date.now() > cached.expiresAt) {
                this.cache.delete(cacheKey);
                return null;
            }

            this.logger.info('Idempotency key found, returning cached response', {
                idempotencyKey,
                tenantId
            });

            return cached.response;
        }

        return null;
    }

    /**
     * Store idempotency key and response
     */
    async storeIdempotency(idempotencyKey, tenantId, response) {
        const cacheKey = `${tenantId}:${idempotencyKey}`;
        const expiresAt = Date.now() + this.ttl;

        this.cache.set(cacheKey, {
            response,
            expiresAt,
            createdAt: Date.now()
        });

        this.logger.info('Idempotency key stored', {
            idempotencyKey,
            tenantId,
            expiresAt: new Date(expiresAt)
        });
    }

    /**
     * Validate idempotency key format
     */
    validateIdempotencyKey(key) {
        if (!key || typeof key !== 'string') {
            throw new IdempotencyError('Idempotency key is required and must be a string');
        }

        if (key.length < 8 || key.length > 255) {
            throw new IdempotencyError('Idempotency key must be between 8 and 255 characters');
        }

        return true;
    }

    /**
     * Process request with idempotency check
     */
    async processWithIdempotency(idempotencyKey, tenantId, operation) {
        // Validate key
        this.validateIdempotencyKey(idempotencyKey);

        // Check for existing response
        const cachedResponse = await this.checkIdempotency(idempotencyKey, tenantId);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Execute operation
        try {
            const response = await operation();

            // Store response
            await this.storeIdempotency(idempotencyKey, tenantId, response);

            return response;
        } catch (error) {
            // Don't cache errors, but log them
            this.logger.error('Operation failed with idempotency key', {
                idempotencyKey,
                tenantId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Clean up expired keys
     */
    cleanupExpiredKeys() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, value] of this.cache.entries()) {
            if (now > value.expiresAt) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            this.logger.info(`Cleaned up ${cleaned} expired idempotency keys`);
        }
    }

    /**
     * Clear all idempotency keys (for testing)
     */
    clear() {
        this.cache.clear();
    }
}

module.exports = { IdempotencyService };

