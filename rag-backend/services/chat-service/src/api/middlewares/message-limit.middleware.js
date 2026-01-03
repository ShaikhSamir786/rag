const messageService = require('../../core/services/message.service');
const { logger } = require('@rag-platform/logger');

// In-memory rate limiting (for production, use Redis)
const rateLimitStore = new Map();

async function messageLimitMiddleware(req, res, next) {
    try {
        const sessionId = req.params.sessionId || req.body.sessionId;
        const maxMessages = process.env.MAX_MESSAGES_PER_SESSION || 100;
        const windowMs = process.env.RATE_LIMIT_WINDOW_MS || 60000; // 1 minute

        if (!sessionId) {
            return next();
        }

        // Check total message count
        const totalMessages = await messageService.getMessageCount(sessionId);

        if (totalMessages >= maxMessages) {
            return res.status(429).json({
                success: false,
                error: 'Message limit reached for this session',
                limit: maxMessages
            });
        }

        // Check rate limiting
        const key = `${sessionId}:${Date.now()}`;
        const now = Date.now();

        // Clean up old entries
        for (const [k, timestamp] of rateLimitStore.entries()) {
            if (now - timestamp > windowMs) {
                rateLimitStore.delete(k);
            }
        }

        // Count recent messages
        const recentMessages = Array.from(rateLimitStore.entries())
            .filter(([k]) => k.startsWith(sessionId))
            .length;

        const maxPerWindow = process.env.MAX_MESSAGES_PER_MINUTE || 10;

        if (recentMessages >= maxPerWindow) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded. Please slow down.',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        // Add to store
        rateLimitStore.set(key, now);

        next();
    } catch (error) {
        logger.error('Message limit middleware error:', error);
        next(error);
    }
}

module.exports = messageLimitMiddleware;
