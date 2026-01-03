const streamingService = require('../../core/services/streaming.service');
const { logger } = require('@rag-platform/logger');

class StreamController {
    async getStreamStatus(req, res, next) {
        try {
            const activeStreams = streamingService.getActiveStreamCount();

            res.json({
                success: true,
                data: {
                    activeStreams,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('Error in getStreamStatus controller:', error);
            next(error);
        }
    }

    async closeStream(req, res, next) {
        try {
            const { streamId } = req.params;

            streamingService.closeStream(streamId);

            res.json({
                success: true,
                message: 'Stream closed successfully'
            });
        } catch (error) {
            logger.error('Error in closeStream controller:', error);
            next(error);
        }
    }
}

module.exports = new StreamController();
