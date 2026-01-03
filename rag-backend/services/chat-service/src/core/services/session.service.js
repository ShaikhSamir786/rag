const sessionRepository = require('../repositories/session.repository');
const sessionFactory = require('../factories/session.factory');
const { logger } = require('@rag-platform/logger');

class SessionService {
    async createSession({ userId, title, metadata }) {
        try {
            const sessionEntity = sessionFactory.create({ userId, title, metadata });
            const session = await sessionRepository.create(sessionEntity.toJSON());

            logger.info(`Session created: ${session.id} for user: ${userId}`);
            return session;
        } catch (error) {
            logger.error('Error creating session:', error);
            throw error;
        }
    }

    async getSession(sessionId) {
        try {
            const session = await sessionRepository.findById(sessionId);

            if (!session) {
                throw new Error(`Session not found: ${sessionId}`);
            }

            return session;
        } catch (error) {
            logger.error('Error getting session:', error);
            throw error;
        }
    }

    async getUserSessions(userId, options = {}) {
        try {
            return await sessionRepository.findByUserId(userId, options);
        } catch (error) {
            logger.error('Error getting user sessions:', error);
            throw error;
        }
    }

    async updateSession(sessionId, updateData) {
        try {
            const session = await sessionRepository.update(sessionId, updateData);

            if (!session) {
                throw new Error(`Session not found: ${sessionId}`);
            }

            logger.info(`Session updated: ${sessionId}`);
            return session;
        } catch (error) {
            logger.error('Error updating session:', error);
            throw error;
        }
    }

    async updateSessionTitle(sessionId, title) {
        try {
            return await this.updateSession(sessionId, { title });
        } catch (error) {
            logger.error('Error updating session title:', error);
            throw error;
        }
    }

    async archiveSession(sessionId) {
        try {
            const session = await sessionRepository.archive(sessionId);
            logger.info(`Session archived: ${sessionId}`);
            return session;
        } catch (error) {
            logger.error('Error archiving session:', error);
            throw error;
        }
    }

    async deleteSession(sessionId) {
        try {
            await sessionRepository.delete(sessionId);
            logger.info(`Session deleted: ${sessionId}`);
            return true;
        } catch (error) {
            logger.error('Error deleting session:', error);
            throw error;
        }
    }

    async validateSessionOwnership(sessionId, userId) {
        try {
            const session = await this.getSession(sessionId);

            if (session.userId !== userId) {
                throw new Error('Unauthorized: Session does not belong to user');
            }

            return true;
        } catch (error) {
            logger.error('Error validating session ownership:', error);
            throw error;
        }
    }
}

module.exports = new SessionService();
