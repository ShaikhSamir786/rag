const SessionEntity = require('../../domain/entities/session.entity');
const SessionConfig = require('../../domain/value-objects/session-config.vo');

class SessionFactory {
    create({ userId, title = 'New Chat', metadata = {} }) {
        if (!userId) {
            throw new Error('User ID is required to create a session');
        }

        const sessionConfig = new SessionConfig(metadata);

        return new SessionEntity({
            userId,
            title,
            metadata: sessionConfig.toJSON(),
            isActive: true,
            lastMessageAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    createFromData(data) {
        return new SessionEntity(data);
    }

    createWithDefaults(userId) {
        return this.create({
            userId,
            title: 'New Chat',
            metadata: {
                model: 'gpt-4',
                temperature: 0.7,
                maxTokens: 2000
            }
        });
    }
}

module.exports = new SessionFactory();
