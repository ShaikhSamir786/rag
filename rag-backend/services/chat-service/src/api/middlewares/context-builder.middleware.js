const contextService = require('../../core/services/context.service');
const { logger } = require('@rag-platform/logger');

async function contextBuilderMiddleware(req, res, next) {
    try {
        const { sessionId, message } = req.body;

        if (!sessionId || !message) {
            return next();
        }

        // Build context and attach to request
        const context = await contextService.buildContext(sessionId, message, {
            includeHistory: true,
            historyLimit: 10,
            includeRAG: true,
            ragTopK: 5,
            ragThreshold: 0.7
        });

        // Attach context to request for use in controller
        req.chatContext = context;

        next();
    } catch (error) {
        logger.error('Context builder middleware error:', error);
        // Don't fail the request if context building fails
        req.chatContext = {
            history: [],
            ragContext: '',
            citations: []
        };
        next();
    }
}

module.exports = contextBuilderMiddleware;
