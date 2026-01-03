const { logger } = require('@rag-platform/logger');

class EmbeddingProcessor {
    async process(job) {
        try {
            const { sessionId, messageId, content } = job.data;

            logger.info(`Embedding message: ${messageId}`);

            // Add your embedding logic here
            // For example: call embedding service to create vector embeddings

            return {
                success: true,
                messageId,
                embeddedAt: new Date()
            };
        } catch (error) {
            logger.error('Error embedding message:', error);
            throw error;
        }
    }
}

module.exports = new EmbeddingProcessor();
