const { logger } = require('@rag-platform/logger');

class SessionCreatedHandler {
    async handle(event) {
        try {
            const { sessionId, userId, timestamp } = event;

            logger.info(`Handling session created event: ${sessionId}`);

            // Add your event handling logic here
            // For example: send welcome message, initialize resources, etc.

            return {
                success: true,
                handledAt: new Date()
            };
        } catch (error) {
            logger.error('Error handling session created event:', error);
            throw error;
        }
    }
}

module.exports = new SessionCreatedHandler();
