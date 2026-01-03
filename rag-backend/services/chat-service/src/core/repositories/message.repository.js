const Message = require('../../domain/models/message.model');
const MessageEntity = require('../../domain/entities/message.entity');
const messageCache = require('../../infrastructure/cache/message-cache');
const { logger } = require('@rag-platform/logger');

class MessageRepository {
    async create(messageData) {
        try {
            const message = new Message(messageData);
            const savedMessage = await message.save();

            // Cache the message
            await messageCache.addMessage(messageData.sessionId, savedMessage.toObject());

            return this.toEntity(savedMessage);
        } catch (error) {
            logger.error('Error creating message:', error);
            throw error;
        }
    }

    async findById(messageId) {
        try {
            const message = await Message.findById(messageId);
            return message ? this.toEntity(message) : null;
        } catch (error) {
            logger.error('Error finding message by ID:', error);
            throw error;
        }
    }

    async findBySessionId(sessionId, options = {}) {
        try {
            const { limit = 50, skip = 0 } = options;

            // Try cache first for recent messages
            if (skip === 0 && limit <= 50) {
                const cachedMessages = await messageCache.getRecentMessages(sessionId, limit);
                if (cachedMessages && cachedMessages.length > 0) {
                    return cachedMessages.map(msg => this.toEntity(msg));
                }
            }

            // Fallback to database
            const messages = await Message.find({ sessionId })
                .sort({ createdAt: 1 })
                .limit(limit)
                .skip(skip);

            return messages.map(message => this.toEntity(message));
        } catch (error) {
            logger.error('Error finding messages by session ID:', error);
            throw error;
        }
    }

    async findConversationHistory(sessionId, limit = 10) {
        try {
            const messages = await Message.find({ sessionId })
                .sort({ createdAt: -1 })
                .limit(limit);

            // Reverse to get chronological order
            return messages.reverse().map(message => this.toEntity(message));
        } catch (error) {
            logger.error('Error finding conversation history:', error);
            throw error;
        }
    }

    async update(messageId, updateData) {
        try {
            const message = await Message.findByIdAndUpdate(
                messageId,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            return message ? this.toEntity(message) : null;
        } catch (error) {
            logger.error('Error updating message:', error);
            throw error;
        }
    }

    async updateFeedback(messageId, feedback) {
        try {
            return await this.update(messageId, { feedback });
        } catch (error) {
            logger.error('Error updating message feedback:', error);
            throw error;
        }
    }

    async delete(messageId) {
        try {
            await Message.findByIdAndDelete(messageId);
            return true;
        } catch (error) {
            logger.error('Error deleting message:', error);
            throw error;
        }
    }

    async deleteBySessionId(sessionId) {
        try {
            await Message.deleteMany({ sessionId });
            await messageCache.clearMessages(sessionId);
            return true;
        } catch (error) {
            logger.error('Error deleting messages by session ID:', error);
            throw error;
        }
    }

    async countBySessionId(sessionId) {
        try {
            return await Message.countDocuments({ sessionId });
        } catch (error) {
            logger.error('Error counting messages:', error);
            throw error;
        }
    }

    toEntity(messageDoc) {
        if (!messageDoc) return null;

        const data = messageDoc.toObject ? messageDoc.toObject() : messageDoc;

        return new MessageEntity({
            id: data._id.toString(),
            sessionId: data.sessionId.toString(),
            role: data.role,
            content: data.content,
            metadata: data.metadata,
            feedback: data.feedback,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
    }
}

module.exports = new MessageRepository();
