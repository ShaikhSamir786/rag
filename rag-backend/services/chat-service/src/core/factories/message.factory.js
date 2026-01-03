const MessageEntity = require('../../domain/entities/message.entity');
const MessageContent = require('../../domain/value-objects/message-content.vo');

class MessageFactory {
    create({ sessionId, role, content, metadata = {} }) {
        if (!sessionId) {
            throw new Error('Session ID is required to create a message');
        }

        if (!role || !['user', 'assistant', 'system'].includes(role)) {
            throw new Error('Valid role (user, assistant, system) is required');
        }

        const messageContent = new MessageContent(content);

        return new MessageEntity({
            sessionId,
            role,
            content: messageContent.toString(),
            metadata,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    createUserMessage(sessionId, content) {
        return this.create({
            sessionId,
            role: 'user',
            content
        });
    }

    createAssistantMessage(sessionId, content, metadata = {}) {
        return this.create({
            sessionId,
            role: 'assistant',
            content,
            metadata
        });
    }

    createSystemMessage(sessionId, content) {
        return this.create({
            sessionId,
            role: 'system',
            content
        });
    }

    createFromData(data) {
        return new MessageEntity(data);
    }
}

module.exports = new MessageFactory();
