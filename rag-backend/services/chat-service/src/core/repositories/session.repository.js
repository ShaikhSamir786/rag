const Session = require('../../domain/models/session.model');
const SessionEntity = require('../../domain/entities/session.entity');
const sessionCache = require('../../infrastructure/cache/session-cache');
const { logger } = require('@rag-platform/logger');

class SessionRepository {
    async create(sessionData) {
        try {
            const session = new Session(sessionData);
            const savedSession = await session.save();

            // Cache the session
            await sessionCache.set(savedSession._id.toString(), savedSession.toObject());

            return this.toEntity(savedSession);
        } catch (error) {
            logger.error('Error creating session:', error);
            throw error;
        }
    }

    async findById(sessionId) {
        try {
            // Try cache first
            const cached = await sessionCache.get(sessionId);
            if (cached) {
                return this.toEntity(cached);
            }

            // Fallback to database
            const session = await Session.findById(sessionId);
            if (session) {
                await sessionCache.set(sessionId, session.toObject());
                return this.toEntity(session);
            }

            return null;
        } catch (error) {
            logger.error('Error finding session by ID:', error);
            throw error;
        }
    }

    async findByUserId(userId, options = {}) {
        try {
            const { limit = 20, skip = 0, includeInactive = false } = options;

            const query = { userId };
            if (!includeInactive) {
                query.isActive = true;
            }

            const sessions = await Session.find(query)
                .sort({ lastMessageAt: -1 })
                .limit(limit)
                .skip(skip);

            return sessions.map(session => this.toEntity(session));
        } catch (error) {
            logger.error('Error finding sessions by user ID:', error);
            throw error;
        }
    }

    async update(sessionId, updateData) {
        try {
            const session = await Session.findByIdAndUpdate(
                sessionId,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            if (session) {
                await sessionCache.set(sessionId, session.toObject());
                return this.toEntity(session);
            }

            return null;
        } catch (error) {
            logger.error('Error updating session:', error);
            throw error;
        }
    }

    async delete(sessionId) {
        try {
            await Session.findByIdAndDelete(sessionId);
            await sessionCache.delete(sessionId);
            return true;
        } catch (error) {
            logger.error('Error deleting session:', error);
            throw error;
        }
    }

    async archive(sessionId) {
        try {
            return await this.update(sessionId, { isActive: false });
        } catch (error) {
            logger.error('Error archiving session:', error);
            throw error;
        }
    }

    async updateLastMessageTime(sessionId) {
        try {
            return await this.update(sessionId, { lastMessageAt: new Date() });
        } catch (error) {
            logger.error('Error updating last message time:', error);
            throw error;
        }
    }

    toEntity(sessionDoc) {
        if (!sessionDoc) return null;

        const data = sessionDoc.toObject ? sessionDoc.toObject() : sessionDoc;

        return new SessionEntity({
            id: data._id.toString(),
            userId: data.userId,
            title: data.title,
            metadata: data.metadata,
            isActive: data.isActive,
            lastMessageAt: data.lastMessageAt,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
    }
}

module.exports = new SessionRepository();
