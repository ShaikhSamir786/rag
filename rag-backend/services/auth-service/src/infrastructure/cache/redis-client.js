const Redis = require('ioredis');
const { logger } = require('@rag-platform/logger');
const { redis: redisConfig } = require('../../config');

class RedisClient {
    constructor() {
        this.client = null;
        this.memoryStore = new Map(); // Fallback in-memory store
        this.isRedisAvailable = false;
        this.initialize();
    }

    async initialize() {
        if (!redisConfig.enabled) {
            logger.warn('Redis is disabled, using in-memory store');
            return;
        }

        try {
            this.client = new Redis(redisConfig.url, redisConfig.options);

            this.client.on('connect', () => {
                logger.info('Redis client connected');
                this.isRedisAvailable = true;
            });

            this.client.on('error', (error) => {
                logger.error('Redis client error:', error);
                this.isRedisAvailable = false;
            });

            this.client.on('close', () => {
                logger.warn('Redis client connection closed');
                this.isRedisAvailable = false;
            });

            // Test connection
            await this.client.ping();
            this.isRedisAvailable = true;
        } catch (error) {
            logger.error('Failed to initialize Redis, using in-memory store:', error);
            this.isRedisAvailable = false;
        }
    }

    async get(key) {
        if (this.isRedisAvailable && this.client) {
            try {
                const value = await this.client.get(key);
                return value ? JSON.parse(value) : null;
            } catch (error) {
                logger.error('Redis get error:', error);
                return this.memoryStore.get(key) || null;
            }
        }
        return this.memoryStore.get(key) || null;
    }

    async set(key, value, expirySeconds = null) {
        const serialized = JSON.stringify(value);

        if (this.isRedisAvailable && this.client) {
            try {
                if (expirySeconds) {
                    await this.client.setex(key, expirySeconds, serialized);
                } else {
                    await this.client.set(key, serialized);
                }
                return true;
            } catch (error) {
                logger.error('Redis set error:', error);
                // Fallback to memory
                this.memoryStore.set(key, value);
                return true;
            }
        }

        // Use memory store
        this.memoryStore.set(key, value);
        if (expirySeconds) {
            setTimeout(() => {
                this.memoryStore.delete(key);
            }, expirySeconds * 1000);
        }
        return true;
    }

    async del(key) {
        if (this.isRedisAvailable && this.client) {
            try {
                await this.client.del(key);
            } catch (error) {
                logger.error('Redis del error:', error);
            }
        }
        this.memoryStore.delete(key);
        return true;
    }

    async exists(key) {
        if (this.isRedisAvailable && this.client) {
            try {
                const result = await this.client.exists(key);
                return result === 1;
            } catch (error) {
                logger.error('Redis exists error:', error);
                return this.memoryStore.has(key);
            }
        }
        return this.memoryStore.has(key);
    }

    async incr(key) {
        if (this.isRedisAvailable && this.client) {
            try {
                return await this.client.incr(key);
            } catch (error) {
                logger.error('Redis incr error:', error);
                const current = this.memoryStore.get(key) || 0;
                const newValue = current + 1;
                this.memoryStore.set(key, newValue);
                return newValue;
            }
        }

        const current = this.memoryStore.get(key) || 0;
        const newValue = current + 1;
        this.memoryStore.set(key, newValue);
        return newValue;
    }

    async expire(key, seconds) {
        if (this.isRedisAvailable && this.client) {
            try {
                await this.client.expire(key, seconds);
            } catch (error) {
                logger.error('Redis expire error:', error);
            }
        }
        // For memory store, we can't set expiry after the fact easily
        // But we already handle it in set() method
    }

    async keys(pattern) {
        if (this.isRedisAvailable && this.client) {
            try {
                return await this.client.keys(pattern);
            } catch (error) {
                logger.error('Redis keys error:', error);
                return Array.from(this.memoryStore.keys()).filter(key => 
                    this.matchPattern(key, pattern)
                );
            }
        }
        return Array.from(this.memoryStore.keys()).filter(key => 
            this.matchPattern(key, pattern)
        );
    }

    matchPattern(key, pattern) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(key);
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.isRedisAvailable = false;
        }
    }
}

// Singleton instance
const redisClient = new RedisClient();

module.exports = { RedisClient, redisClient };

