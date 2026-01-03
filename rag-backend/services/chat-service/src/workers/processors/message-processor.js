const { logger } = require('@rag-platform/logger');

class MessageProcessor {
    async process(job) {
        try {
            const { sessionId, messageId, content } = job.data;

            logger.info(`Processing message: ${messageId} in session: ${sessionId}`);

            // Add your message processing logic here
            // For example: sentiment analysis, content moderation, etc.

            return {
                success: true,
                messageId,
                processedAt: new Date()
            };
        } catch (error) {
            logger.error('Error processing message:', error);
            throw error;
        }
    }
}

module.exports = new MessageProcessor();
