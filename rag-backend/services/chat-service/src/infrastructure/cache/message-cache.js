const Redis = require('ioredis');
const { logger } = require('@rag-platform/logger');

class MessageCache {
    constructor() {
        this.client = null;
        this.ttl = 1800; // 30 minutes default TTL
    }

    async connect() {
        try {
            this.client = new Redis({
                host: process.env.REDIS_HOST || 'redis',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD,
                db: 2, // Use DB 2 for message cache
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                }
            });

            this.client.on('error', (err) => {
                logger.error('Message cache error:', err);
            });

            this.client.on('connect', () => {
                logger.info('Message cache connected');
            });

            return this.client;
        } catch (error) {
            logger.error('Failed to connect to message cache:', error);
            throw error;
        }
    }

    async getRecentMessages(sessionId, limit = 10) {
        try {
            const key = `messages:${sessionId}`;
            const messages = await this.client.lrange(key, 0, limit - 1);
            return messages.map(msg => JSON.parse(msg));
        } catch (error) {
            logger.error('Error getting recent messages from cache:', error);
            return [];
        }
    }

    async addMessage(sessionId, messageData, ttl = this.ttl) {
        try {
            const key = `messages:${sessionId}`;
            await this.client.lpush(key, JSON.stringify(messageData));
            await this.client.ltrim(key, 0, 49); // Keep only last 50 messages
            await this.client.expire(key, ttl);
            return true;
        } catch (error) {
            logger.error('Error adding message to cache:', error);
            return false;
        }
    }

    async clearMessages(sessionId) {
        try {
            const key = `messages:${sessionId}`;
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Error clearing messages from cache:', error);
            return false;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit();
        }
    }
}

module.exports = new MessageCache();
