const { redisClient } = require('../../infrastructure/cache/redis-client');
const { security } = require('../../config');
const { BaseError, ErrorCode } = require('@rag-platform/common');
const { logger } = require('@rag-platform/logger');

class RateLimitMiddleware {
    createRateLimiter(windowMs, maxAttempts, keyGenerator = null) {
        return async (req, res, next) => {
            try {
                // Generate rate limit key
                const key = keyGenerator 
                    ? keyGenerator(req) 
                    : `rate:limit:${req.ip}:${req.path}`;

                // Increment counter
                const count = await redisClient.incr(key);

                // Set expiry on first request
                if (count === 1) {
                    await redisClient.expire(key, Math.floor(windowMs / 1000));
                }

                // Check if limit exceeded
                if (count > maxAttempts) {
                    const retryAfter = Math.ceil(windowMs / 1000);
                    res.setHeader('Retry-After', retryAfter);
                    return next(new BaseError(
                        ErrorCode.VALIDATION_ERROR,
                        `Too many requests. Please try again after ${Math.ceil(retryAfter / 60)} minute(s).`,
                        429
                    ));
                }

                // Set rate limit headers
                res.setHeader('X-RateLimit-Limit', maxAttempts);
                res.setHeader('X-RateLimit-Remaining', Math.max(0, maxAttempts - count));
                res.setHeader('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());

                next();
            } catch (error) {
                // Fail open - don't block requests if rate limiting fails
                logger.error('Rate limiting error:', error);
                next();
            }
        };
    }

    // Pre-configured rate limiters
    loginRateLimit = this.createRateLimiter(
        security.rateLimit.loginWindowMs,
        security.rateLimit.loginMaxAttempts,
        (req) => `rate:limit:login:${req.ip}`
    );

    registerRateLimit = this.createRateLimiter(
        security.rateLimit.registerWindowMs,
        security.rateLimit.registerMaxAttempts,
        (req) => `rate:limit:register:${req.ip}`
    );

    otpRateLimit = this.createRateLimiter(
        security.rateLimit.otpWindowMs,
        security.rateLimit.otpMaxAttempts,
        (req) => {
            const email = req.body?.email || req.query?.email || 'unknown';
            return `rate:limit:otp:${email}`;
        }
    );

    passwordResetRateLimit = this.createRateLimiter(
        security.rateLimit.passwordResetWindowMs,
        security.rateLimit.passwordResetMaxAttempts,
        (req) => {
            const email = req.body?.email || req.query?.email || 'unknown';
            return `rate:limit:password:reset:${email}`;
        }
    );
}

const rateLimitMiddleware = new RateLimitMiddleware();

module.exports = { RateLimitMiddleware, rateLimitMiddleware };

