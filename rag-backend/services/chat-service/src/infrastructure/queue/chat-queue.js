const Bull = require('bull');
const { logger } = require('@rag-platform/logger');

class ChatQueue {
    constructor() {
        this.queue = null;
    }

    async initialize() {
        try {
            this.queue = new Bull('chat-processing', {
                redis: {
                    host: process.env.REDIS_HOST || 'redis',
                    port: process.env.REDIS_PORT || 6379,
                    password: process.env.REDIS_PASSWORD
                }
            });

            this.queue.on('error', (error) => {
                logger.error('Chat queue error:', error);
            });

            this.queue.on('completed', (job) => {
                logger.info(`Job ${job.id} completed`);
            });

            this.queue.on('failed', (job, err) => {
                logger.error(`Job ${job.id} failed:`, err);
            });

            logger.info('Chat queue initialized');
            return this.queue;
        } catch (error) {
            logger.error('Failed to initialize chat queue:', error);
            throw error;
        }
    }

    async addMessageProcessingJob(data) {
        try {
            const job = await this.queue.add('process-message', data, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                }
            });
            return job;
        } catch (error) {
            logger.error('Error adding message processing job:', error);
            throw error;
        }
    }

    async addEmbeddingJob(data) {
        try {
            const job = await this.queue.add('embed-message', data, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                }
            });
            return job;
        } catch (error) {
            logger.error('Error adding embedding job:', error);
            throw error;
        }
    }

    async addAnalyticsJob(data) {
        try {
            const job = await this.queue.add('log-analytics', data, {
                attempts: 2,
                backoff: {
                    type: 'fixed',
                    delay: 1000
                }
            });
            return job;
        } catch (error) {
            logger.error('Error adding analytics job:', error);
            throw error;
        }
    }

    async close() {
        if (this.queue) {
            await this.queue.close();
        }
    }
}

module.exports = new ChatQueue();
