const messageService = require('../../core/services/message.service');
const historyService = require('../../core/services/history.service');
const sessionService = require('../../core/services/session.service');
const { logger } = require('@rag-platform/logger');

class MessageController {
    async getMessages(req, res, next) {
        try {
            const { sessionId } = req.params;
            const { limit = 50, skip = 0 } = req.query;
            const userId = req.user?.id;

            // Validate session ownership
            await sessionService.validateSessionOwnership(sessionId, userId);

            const messages = await messageService.getSessionMessages(sessionId, {
                limit: parseInt(limit),
                skip: parseInt(skip)
            });

            res.json({
                success: true,
                data: messages
            });
        } catch (error) {
            logger.error('Error in getMessages controller:', error);
            next(error);
        }
    }

    async getMessage(req, res, next) {
        try {
            const { messageId } = req.params;

            const message = await messageService.getMessage(messageId);

            res.json({
                success: true,
                data: message
            });
        } catch (error) {
            logger.error('Error in getMessage controller:', error);
            next(error);
        }
    }

    async addFeedback(req, res, next) {
        try {
            const { messageId } = req.params;
            const { rating, comment } = req.body;

            const message = await messageService.addFeedback(messageId, rating, comment);

            res.json({
                success: true,
                data: message
            });
        } catch (error) {
            logger.error('Error in addFeedback controller:', error);
            next(error);
        }
    }

    async deleteMessage(req, res, next) {
        try {
            const { messageId } = req.params;

            await messageService.deleteMessage(messageId);

            res.json({
                success: true,
                message: 'Message deleted successfully'
            });
        } catch (error) {
            logger.error('Error in deleteMessage controller:', error);
            next(error);
        }
    }

    async getHistory(req, res, next) {
        try {
            const { sessionId } = req.params;
            const { limit = 50, skip = 0 } = req.query;
            const userId = req.user?.id;

            // Validate session ownership
            await sessionService.validateSessionOwnership(sessionId, userId);

            const history = await historyService.getHistory(sessionId, {
                limit: parseInt(limit),
                skip: parseInt(skip)
            });

            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            logger.error('Error in getHistory controller:', error);
            next(error);
        }
    }

    async exportHistory(req, res, next) {
        try {
            const { sessionId } = req.params;
            const userId = req.user?.id;

            // Validate session ownership
            await sessionService.validateSessionOwnership(sessionId, userId);

            const exportData = await historyService.exportHistory(sessionId);

            res.json({
                success: true,
                data: exportData
            });
        } catch (error) {
            logger.error('Error in exportHistory controller:', error);
            next(error);
        }
    }

    async clearHistory(req, res, next) {
        try {
            const { sessionId } = req.params;
            const userId = req.user?.id;

            // Validate session ownership
            await sessionService.validateSessionOwnership(sessionId, userId);

            await historyService.clearHistory(sessionId);

            res.json({
                success: true,
                message: 'History cleared successfully'
            });
        } catch (error) {
            logger.error('Error in clearHistory controller:', error);
            next(error);
        }
    }
}

module.exports = new MessageController();
