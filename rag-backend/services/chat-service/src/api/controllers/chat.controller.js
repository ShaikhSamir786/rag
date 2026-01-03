const chatService = require('../../core/services/chat.service');
const sessionService = require('../../core/services/session.service');
const { logger } = require('@rag-platform/logger');

class ChatController {
    async sendMessage(req, res, next) {
        try {
            const { sessionId, message, model, stream } = req.body;
            const userId = req.user?.id; // Assuming auth middleware sets req.user

            // Validate session ownership
            await sessionService.validateSessionOwnership(sessionId, userId);

            const result = await chatService.sendMessage({
                sessionId,
                userId,
                content: message,
                model,
                stream: stream || false
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error in sendMessage controller:', error);
            next(error);
        }
    }

    async streamMessage(req, res, next) {
        try {
            const { sessionId, message, model } = req.body;
            const userId = req.user?.id;

            // Validate session ownership
            await sessionService.validateSessionOwnership(sessionId, userId);

            // Stream response
            await chatService.sendMessage({
                sessionId,
                userId,
                content: message,
                model,
                stream: true,
                res
            });
        } catch (error) {
            logger.error('Error in streamMessage controller:', error);

            // Send error event if streaming
            if (res.headersSent) {
                res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
                res.end();
            } else {
                next(error);
            }
        }
    }

    async regenerateResponse(req, res, next) {
        try {
            const { sessionId, messageId, model } = req.body;
            const userId = req.user?.id;

            // Validate session ownership
            await sessionService.validateSessionOwnership(sessionId, userId);

            const result = await chatService.regenerateResponse(sessionId, messageId, model);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error in regenerateResponse controller:', error);
            next(error);
        }
    }
}

module.exports = new ChatController();
