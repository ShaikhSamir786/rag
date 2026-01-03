const messageRepository = require('../repositories/message.repository');
const { logger } = require('@rag-platform/logger');

class HistoryService {
    async getHistory(sessionId, options = {}) {
        try {
            const { limit = 50, skip = 0 } = options;
            return await messageRepository.findBySessionId(sessionId, { limit, skip });
        } catch (error) {
            logger.error('Error getting history:', error);
            throw error;
        }
    }

    async getRecentHistory(sessionId, limit = 10) {
        try {
            return await messageRepository.findConversationHistory(sessionId, limit);
        } catch (error) {
            logger.error('Error getting recent history:', error);
            throw error;
        }
    }

    async formatHistoryForLLM(sessionId, limit = 10) {
        try {
            const messages = await this.getRecentHistory(sessionId, limit);

            return messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));
        } catch (error) {
            logger.error('Error formatting history for LLM:', error);
            throw error;
        }
    }

    async clearHistory(sessionId) {
        try {
            await messageRepository.deleteBySessionId(sessionId);
            logger.info(`History cleared for session: ${sessionId}`);
            return true;
        } catch (error) {
            logger.error('Error clearing history:', error);
            throw error;
        }
    }

    async exportHistory(sessionId) {
        try {
            const messages = await messageRepository.findBySessionId(sessionId, { limit: 1000 });

            return {
                sessionId,
                messageCount: messages.length,
                messages: messages.map(msg => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.createdAt,
                    feedback: msg.feedback
                })),
                exportedAt: new Date()
            };
        } catch (error) {
            logger.error('Error exporting history:', error);
            throw error;
        }
    }
}

module.exports = new HistoryService();
