const sessionService = require('../../core/services/session.service');
const { logger } = require('@rag-platform/logger');

class SessionController {
    async createSession(req, res, next) {
        try {
            const { title, metadata } = req.body;
            const userId = req.user?.id;

            const session = await sessionService.createSession({
                userId,
                title,
                metadata
            });

            res.status(201).json({
                success: true,
                data: session
            });
        } catch (error) {
            logger.error('Error in createSession controller:', error);
            next(error);
        }
    }

    async getSession(req, res, next) {
        try {
            const { sessionId } = req.params;
            const userId = req.user?.id;

            // Validate ownership
            await sessionService.validateSessionOwnership(sessionId, userId);

            const session = await sessionService.getSession(sessionId);

            res.json({
                success: true,
                data: session
            });
        } catch (error) {
            logger.error('Error in getSession controller:', error);
            next(error);
        }
    }

    async getUserSessions(req, res, next) {
        try {
            const userId = req.user?.id;
            const { limit = 20, skip = 0, includeInactive = false } = req.query;

            const sessions = await sessionService.getUserSessions(userId, {
                limit: parseInt(limit),
                skip: parseInt(skip),
                includeInactive: includeInactive === 'true'
            });

            res.json({
                success: true,
                data: sessions
            });
        } catch (error) {
            logger.error('Error in getUserSessions controller:', error);
            next(error);
        }
    }

    async updateSession(req, res, next) {
        try {
            const { sessionId } = req.params;
            const { title, metadata } = req.body;
            const userId = req.user?.id;

            // Validate ownership
            await sessionService.validateSessionOwnership(sessionId, userId);

            const session = await sessionService.updateSession(sessionId, {
                title,
                metadata
            });

            res.json({
                success: true,
                data: session
            });
        } catch (error) {
            logger.error('Error in updateSession controller:', error);
            next(error);
        }
    }

    async archiveSession(req, res, next) {
        try {
            const { sessionId } = req.params;
            const userId = req.user?.id;

            // Validate ownership
            await sessionService.validateSessionOwnership(sessionId, userId);

            const session = await sessionService.archiveSession(sessionId);

            res.json({
                success: true,
                data: session
            });
        } catch (error) {
            logger.error('Error in archiveSession controller:', error);
            next(error);
        }
    }

    async deleteSession(req, res, next) {
        try {
            const { sessionId } = req.params;
            const userId = req.user?.id;

            // Validate ownership
            await sessionService.validateSessionOwnership(sessionId, userId);

            await sessionService.deleteSession(sessionId);

            res.json({
                success: true,
                message: 'Session deleted successfully'
            });
        } catch (error) {
            logger.error('Error in deleteSession controller:', error);
            next(error);
        }
    }
}

module.exports = new SessionController();
