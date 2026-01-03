const Redis = require('ioredis');
const { logger } = require('@rag-platform/logger');

/**
 * Question Cache
 * Caches generated questions to improve performance and reduce LLM costs
 */
class QuestionCache {
    constructor() {
        this.redis = null;
        this.enabled = process.env.QUESTION_CACHE_ENABLED !== 'false';
        this.ttl = parseInt(process.env.QUESTION_CACHE_TTL || '3600', 10); // 1 hour default
        this.prefix = 'question:';
        this.statsPrefix = 'question:stats:';

        if (this.enabled) {
            this._initializeRedis();
        }
    }

    /**
     * Initialize Redis connection
     * @private
     */
    _initializeRedis() {
        try {
            this.redis = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
                password: process.env.REDIS_PASSWORD || undefined,
                db: parseInt(process.env.REDIS_DB || '0', 10),
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                }
            });

            this.redis.on('connect', () => {
                logger.info('Question cache connected to Redis');
            });

            this.redis.on('error', (error) => {
                logger.error('Question cache Redis error:', error);
            });

        } catch (error) {
            logger.error('Failed to initialize question cache:', error);
            this.enabled = false;
        }
    }

    /**
     * Get cached questions
     * @param {string} key - Cache key
     * @returns {Promise<Object[]|null>} Cached questions or null
     */
    async get(key) {
        if (!this.enabled || !this.redis) {
            return null;
        }

        try {
            const cacheKey = this.prefix + key;
            const cached = await this.redis.get(cacheKey);

            if (cached) {
                await this._incrementStat('hits');
                logger.debug('Question cache hit', { key });
                return JSON.parse(cached);
            }

            await this._incrementStat('misses');
            logger.debug('Question cache miss', { key });
            return null;

        } catch (error) {
            logger.error('Error getting from question cache:', error);
            return null;
        }
    }

    /**
     * Set cached questions
     * @param {string} key - Cache key
     * @param {Object[]} questions - Questions to cache
     * @param {number} ttl - Time to live in seconds (optional)
     * @returns {Promise<boolean>} Success
     */
    async set(key, questions, ttl = null) {
        if (!this.enabled || !this.redis) {
            return false;
        }

        try {
            const cacheKey = this.prefix + key;
            const value = JSON.stringify(questions);
            const expiry = ttl || this.ttl;

            await this.redis.setex(cacheKey, expiry, value);
            await this._incrementStat('sets');

            logger.debug('Question cached', { key, ttl: expiry });
            return true;

        } catch (error) {
            logger.error('Error setting question cache:', error);
            return false;
        }
    }

    /**
     * Delete cached questions
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} Success
     */
    async delete(key) {
        if (!this.enabled || !this.redis) {
            return false;
        }

        try {
            const cacheKey = this.prefix + key;
            await this.redis.del(cacheKey);

            logger.debug('Question cache deleted', { key });
            return true;

        } catch (error) {
            logger.error('Error deleting from question cache:', error);
            return false;
        }
    }

    /**
     * Invalidate cache for a file
     * @param {string} filePath - File path
     * @returns {Promise<number>} Number of keys deleted
     */
    async invalidateFile(filePath) {
        if (!this.enabled || !this.redis) {
            return 0;
        }

        try {
            // Find all cache keys containing the file path
            const pattern = `${this.prefix}*${filePath}*`;
            const keys = await this.redis.keys(pattern);

            if (keys.length > 0) {
                await this.redis.del(...keys);
                logger.info('Question cache invalidated for file', {
                    filePath,
                    keysDeleted: keys.length
                });
            }

            return keys.length;

        } catch (error) {
            logger.error('Error invalidating question cache:', error);
            return 0;
        }
    }

    /**
     * Clear all question cache
     * @returns {Promise<boolean>} Success
     */
    async clear() {
        if (!this.enabled || !this.redis) {
            return false;
        }

        try {
            const pattern = `${this.prefix}*`;
            const keys = await this.redis.keys(pattern);

            if (keys.length > 0) {
                await this.redis.del(...keys);
                logger.info('Question cache cleared', { keysDeleted: keys.length });
            }

            return true;

        } catch (error) {
            logger.error('Error clearing question cache:', error);
            return false;
        }
    }

    /**
     * Get cache statistics
     * @returns {Promise<Object>} Cache statistics
     */
    async getStats() {
        if (!this.enabled || !this.redis) {
            return {
                enabled: false,
                hits: 0,
                misses: 0,
                sets: 0,
                hitRate: 0
            };
        }

        try {
            const hits = parseInt(await this.redis.get(`${this.statsPrefix}hits`) || '0', 10);
            const misses = parseInt(await this.redis.get(`${this.statsPrefix}misses`) || '0', 10);
            const sets = parseInt(await this.redis.get(`${this.statsPrefix}sets`) || '0', 10);

            const total = hits + misses;
            const hitRate = total > 0 ? (hits / total * 100).toFixed(2) : 0;

            return {
                enabled: true,
                hits,
                misses,
                sets,
                hitRate: parseFloat(hitRate)
            };

        } catch (error) {
            logger.error('Error getting cache stats:', error);
            return {
                enabled: true,
                hits: 0,
                misses: 0,
                sets: 0,
                hitRate: 0
            };
        }
    }

    /**
     * Reset cache statistics
     * @returns {Promise<boolean>} Success
     */
    async resetStats() {
        if (!this.enabled || !this.redis) {
            return false;
        }

        try {
            await this.redis.del(
                `${this.statsPrefix}hits`,
                `${this.statsPrefix}misses`,
                `${this.statsPrefix}sets`
            );

            logger.info('Question cache stats reset');
            return true;

        } catch (error) {
            logger.error('Error resetting cache stats:', error);
            return false;
        }
    }

    /**
     * Increment cache statistic
     * @private
     */
    async _incrementStat(stat) {
        try {
            await this.redis.incr(`${this.statsPrefix}${stat}`);
        } catch (error) {
            logger.error('Error incrementing cache stat:', error);
        }
    }

    /**
     * Close Redis connection
     * @returns {Promise<void>}
     */
    async close() {
        if (this.redis) {
            await this.redis.quit();
            logger.info('Question cache connection closed');
        }
    }
}

module.exports = new QuestionCache();
