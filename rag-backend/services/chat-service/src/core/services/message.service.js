const messageRepository = require('../repositories/message.repository');
const messageFactory = require('../factories/message.factory');
const sessionRepository = require('../repositories/session.repository');
const { logger } = require('@rag-platform/logger');

class MessageService {
    async createMessage({ sessionId, role, content, metadata }) {
        try {
            const messageEntity = messageFactory.create({ sessionId, role, content, metadata });
            const message = await messageRepository.create(messageEntity.toJSON());

            // Update session's last message time
            await sessionRepository.updateLastMessageTime(sessionId);

            logger.info(`Message created: ${message.id} in session: ${sessionId}`);
            return message;
        } catch (error) {
            logger.error('Error creating message:', error);
            throw error;
        }
    }

    async getMessage(messageId) {
        try {
            const message = await messageRepository.findById(messageId);

            if (!message) {
                throw new Error(`Message not found: ${messageId}`);
            }

            return message;
        } catch (error) {
            logger.error('Error getting message:', error);
            throw error;
        }
    }

    async getSessionMessages(sessionId, options = {}) {
        try {
            return await messageRepository.findBySessionId(sessionId, options);
        } catch (error) {
            logger.error('Error getting session messages:', error);
            throw error;
        }
    }

    async updateMessage(messageId, updateData) {
        try {
            const message = await messageRepository.update(messageId, updateData);

            if (!message) {
                throw new Error(`Message not found: ${messageId}`);
            }

            logger.info(`Message updated: ${messageId}`);
            return message;
        } catch (error) {
            logger.error('Error updating message:', error);
            throw error;
        }
    }

    async addFeedback(messageId, rating, comment = null) {
        try {
            const feedback = {
                rating,
                comment,
                createdAt: new Date()
            };

            const message = await messageRepository.updateFeedback(messageId, feedback);
            logger.info(`Feedback added to message: ${messageId}`);
            return message;
        } catch (error) {
            logger.error('Error adding feedback:', error);
            throw error;
        }
    }

    async deleteMessage(messageId) {
        try {
            await messageRepository.delete(messageId);
            logger.info(`Message deleted: ${messageId}`);
            return true;
        } catch (error) {
            logger.error('Error deleting message:', error);
            throw error;
        }
    }

    async deleteSessionMessages(sessionId) {
        try {
            await messageRepository.deleteBySessionId(sessionId);
            logger.info(`All messages deleted for session: ${sessionId}`);
            return true;
        } catch (error) {
            logger.error('Error deleting session messages:', error);
            throw error;
        }
    }

    async getMessageCount(sessionId) {
        try {
            return await messageRepository.countBySessionId(sessionId);
        } catch (error) {
            logger.error('Error getting message count:', error);
            throw error;
        }
    }
}

module.exports = new MessageService();
