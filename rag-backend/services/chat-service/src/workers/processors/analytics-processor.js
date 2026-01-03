const { logger } = require('@rag-platform/logger');

class AnalyticsProcessor {
    async process(job) {
        try {
            const { sessionId, messageId, userId, model, tokens } = job.data;

            logger.info(`Logging analytics for message: ${messageId}`);

            // Add your analytics logging here
            // For example: send to analytics service, ClickHouse, etc.

            const analyticsData = {
                sessionId,
                messageId,
                userId,
                model,
                tokens,
                timestamp: new Date()
            };

            // Log to analytics service
            // await analyticsService.log(analyticsData);

            return {
                success: true,
                loggedAt: new Date()
            };
        } catch (error) {
            logger.error('Error logging analytics:', error);
            throw error;
        }
    }
}

module.exports = new AnalyticsProcessor();
