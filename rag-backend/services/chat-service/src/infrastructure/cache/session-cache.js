const Redis = require('ioredis');
const { logger } = require('@rag-platform/logger');

class SessionCache {
    constructor() {
        this.client = null;
        this.ttl = 3600; // 1 hour default TTL
    }

    async connect() {
        try {
            this.client = new Redis({
                host: process.env.REDIS_HOST || 'redis',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD,
                db: 1, // Use DB 1 for session cache
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                }
            });

            this.client.on('error', (err) => {
                logger.error('Session cache error:', err);
            });

            this.client.on('connect', () => {
                logger.info('Session cache connected');
            });

            return this.client;
        } catch (error) {
            logger.error('Failed to connect to session cache:', error);
            throw error;
        }
    }

    async get(sessionId) {
        try {
            const key = `session:${sessionId}`;
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Error getting session from cache:', error);
            return null;
        }
    }

    async set(sessionId, sessionData, ttl = this.ttl) {
        try {
            const key = `session:${sessionId}`;
            await this.client.setex(key, ttl, JSON.stringify(sessionData));
            return true;
        } catch (error) {
            logger.error('Error setting session in cache:', error);
            return false;
        }
    }

    async delete(sessionId) {
        try {
            const key = `session:${sessionId}`;
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Error deleting session from cache:', error);
            return false;
        }
    }

    async exists(sessionId) {
        try {
            const key = `session:${sessionId}`;
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            logger.error('Error checking session existence in cache:', error);
            return false;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit();
        }
    }
}

module.exports = new SessionCache();
