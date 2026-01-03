const sessionService = require('../../core/services/session.service');
const { logger } = require('@rag-platform/logger');

async function validateSessionOwnership(req, res, next) {
    try {
        const sessionId = req.params.sessionId || req.body.sessionId;
        const userId = req.user?.id;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }

        // Validate ownership
        await sessionService.validateSessionOwnership(sessionId, userId);

        next();
    } catch (error) {
        logger.error('Session validation error:', error);

        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to access this session'
            });
        }

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error validating session'
        });
    }
}

module.exports = validateSessionOwnership;
