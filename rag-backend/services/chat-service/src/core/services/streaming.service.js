const { logger } = require('@rag-platform/logger');

class StreamingService {
    constructor() {
        this.activeStreams = new Map();
    }

    createStream(sessionId, res) {
        try {
            // Set SSE headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');

            const streamId = `${sessionId}-${Date.now()}`;
            this.activeStreams.set(streamId, { sessionId, res });

            logger.info(`Stream created: ${streamId}`);
            return streamId;
        } catch (error) {
            logger.error('Error creating stream:', error);
            throw error;
        }
    }

    sendEvent(streamId, event, data) {
        try {
            const stream = this.activeStreams.get(streamId);

            if (!stream) {
                throw new Error(`Stream not found: ${streamId}`);
            }

            const { res } = stream;
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);

            return true;
        } catch (error) {
            logger.error('Error sending event:', error);
            return false;
        }
    }

    sendChunk(streamId, chunk) {
        return this.sendEvent(streamId, 'chunk', { content: chunk });
    }

    sendComplete(streamId, data = {}) {
        try {
            this.sendEvent(streamId, 'complete', data);
            this.closeStream(streamId);
            return true;
        } catch (error) {
            logger.error('Error sending complete event:', error);
            return false;
        }
    }

    sendError(streamId, error) {
        try {
            this.sendEvent(streamId, 'error', {
                message: error.message || 'An error occurred'
            });
            this.closeStream(streamId);
            return true;
        } catch (err) {
            logger.error('Error sending error event:', err);
            return false;
        }
    }

    closeStream(streamId) {
        try {
            const stream = this.activeStreams.get(streamId);

            if (stream) {
                stream.res.end();
                this.activeStreams.delete(streamId);
                logger.info(`Stream closed: ${streamId}`);
            }

            return true;
        } catch (error) {
            logger.error('Error closing stream:', error);
            return false;
        }
    }

    async processLLMStream(streamId, llmStream, onChunk, onComplete) {
        try {
            let fullContent = '';

            llmStream.on('data', (chunk) => {
                const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            continue;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;

                            if (content) {
                                fullContent += content;
                                this.sendChunk(streamId, content);

                                if (onChunk) {
                                    onChunk(content);
                                }
                            }
                        } catch (err) {
                            logger.warn('Error parsing stream chunk:', err);
                        }
                    }
                }
            });

            llmStream.on('end', () => {
                if (onComplete) {
                    onComplete(fullContent);
                }
                this.sendComplete(streamId, { fullContent });
            });

            llmStream.on('error', (error) => {
                logger.error('LLM stream error:', error);
                this.sendError(streamId, error);
            });
        } catch (error) {
            logger.error('Error processing LLM stream:', error);
            this.sendError(streamId, error);
        }
    }

    getActiveStreamCount() {
        return this.activeStreams.size;
    }
}

module.exports = new StreamingService();
