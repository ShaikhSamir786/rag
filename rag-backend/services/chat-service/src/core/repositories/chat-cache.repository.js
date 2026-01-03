const sessionCache = require('../../infrastructure/cache/session-cache');
const messageCache = require('../../infrastructure/cache/message-cache');
const { logger } = require('@rag-platform/logger');

class ChatCacheRepository {
    async cacheSession(sessionId, sessionData, ttl = 3600) {
        try {
            return await sessionCache.set(sessionId, sessionData, ttl);
        } catch (error) {
            logger.error('Error caching session:', error);
            return false;
        }
    }

    async getCachedSession(sessionId) {
        try {
            return await sessionCache.get(sessionId);
        } catch (error) {
            logger.error('Error getting cached session:', error);
            return null;
        }
    }

    async invalidateSession(sessionId) {
        try {
            return await sessionCache.delete(sessionId);
        } catch (error) {
            logger.error('Error invalidating session cache:', error);
            return false;
        }
    }

    async cacheMessage(sessionId, messageData) {
        try {
            return await messageCache.addMessage(sessionId, messageData);
        } catch (error) {
            logger.error('Error caching message:', error);
            return false;
        }
    }

    async getCachedMessages(sessionId, limit = 10) {
        try {
            return await messageCache.getRecentMessages(sessionId, limit);
        } catch (error) {
            logger.error('Error getting cached messages:', error);
            return [];
        }
    }

    async invalidateMessages(sessionId) {
        try {
            return await messageCache.clearMessages(sessionId);
        } catch (error) {
            logger.error('Error invalidating message cache:', error);
            return false;
        }
    }

    async warmUpCache(sessionId, sessionData, messages) {
        try {
            await this.cacheSession(sessionId, sessionData);

            for (const message of messages) {
                await this.cacheMessage(sessionId, message);
            }

            return true;
        } catch (error) {
            logger.error('Error warming up cache:', error);
            return false;
        }
    }
}

module.exports = new ChatCacheRepository();
