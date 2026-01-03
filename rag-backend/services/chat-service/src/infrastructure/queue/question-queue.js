const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const questionGenerator = require('../../core/services/question-generator.service');
const questionRepository = require('../../core/repositories/question.repository');
const { logger } = require('@rag-platform/logger');

/**
 * Question Queue
 * Handles async processing for question generation and maintenance
 */
class QuestionQueue {
    constructor() {
        this.connection = null;
        this.queues = {};
        this.workers = {};
        this.enabled = process.env.QUESTION_QUEUE_ENABLED !== 'false';

        if (this.enabled) {
            this._initializeConnection();
            this._initializeQueues();
            this._initializeWorkers();
        }
    }

    /**
     * Initialize Redis connection for BullMQ
     * @private
     */
    _initializeConnection() {
        try {
            this.connection = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
                password: process.env.REDIS_PASSWORD || undefined,
                db: parseInt(process.env.REDIS_DB || '0', 10),
                maxRetriesPerRequest: null
            });

            logger.info('Question queue connected to Redis');

        } catch (error) {
            logger.error('Failed to initialize question queue connection:', error);
            this.enabled = false;
        }
    }

    /**
     * Initialize queues
     * @private
     */
    _initializeQueues() {
        try {
            // Question generation queue
            this.queues.generation = new Queue('question-generation', {
                connection: this.connection,
                defaultJobOptions: {
                    attempts: parseInt(process.env.QUESTION_QUEUE_RETRY_ATTEMPTS || '3', 10),
                    backoff: {
                        type: 'exponential',
                        delay: 2000
                    },
                    removeOnComplete: {
                        count: 100,
                        age: 24 * 3600 // 24 hours
                    },
                    removeOnFail: {
                        count: 50
                    }
                }
            });

            // Codebase analysis queue
            this.queues.analysis = new Queue('codebase-analysis', {
                connection: this.connection,
                defaultJobOptions: {
                    attempts: 2,
                    backoff: {
                        type: 'exponential',
                        delay: 5000
                    }
                }
            });

            // Cleanup queue
            this.queues.cleanup = new Queue('question-cleanup', {
                connection: this.connection,
                defaultJobOptions: {
                    attempts: 1
                }
            });

            logger.info('Question queues initialized');

        } catch (error) {
            logger.error('Failed to initialize question queues:', error);
            this.enabled = false;
        }
    }

    /**
     * Initialize workers
     * @private
     */
    _initializeWorkers() {
        try {
            const concurrency = parseInt(process.env.QUESTION_QUEUE_CONCURRENCY || '5', 10);

            // Generation worker
            this.workers.generation = new Worker(
                'question-generation',
                async (job) => await this._processGenerationJob(job),
                {
                    connection: this.connection,
                    concurrency
                }
            );

            // Analysis worker
            this.workers.analysis = new Worker(
                'codebase-analysis',
                async (job) => await this._processAnalysisJob(job),
                {
                    connection: this.connection,
                    concurrency: Math.max(1, Math.floor(concurrency / 2))
                }
            );

            // Cleanup worker
            this.workers.cleanup = new Worker(
                'question-cleanup',
                async (job) => await this._processCleanupJob(job),
                {
                    connection: this.connection,
                    concurrency: 1
                }
            );

            // Setup event listeners
            this._setupEventListeners();

            logger.info('Question workers initialized', { concurrency });

        } catch (error) {
            logger.error('Failed to initialize question workers:', error);
            this.enabled = false;
        }
    }

    /**
     * Setup event listeners for workers
     * @private
     */
    _setupEventListeners() {
        Object.entries(this.workers).forEach(([name, worker]) => {
            worker.on('completed', (job) => {
                logger.info(`Question job completed: ${name}`, { jobId: job.id });
            });

            worker.on('failed', (job, error) => {
                logger.error(`Question job failed: ${name}`, {
                    jobId: job?.id,
                    error: error.message
                });
            });

            worker.on('error', (error) => {
                logger.error(`Question worker error: ${name}`, { error: error.message });
            });
        });
    }

    /**
     * Add question generation job
     * @param {Object} data - Job data
     * @returns {Promise<Object>} Job
     */
    async addGenerationJob(data) {
        if (!this.enabled) {
            logger.warn('Question queue is disabled, processing synchronously');
            return await this._processGenerationJob({ data });
        }

        try {
            const job = await this.queues.generation.add('generate-questions', data, {
                priority: data.priority || 5
            });

            logger.info('Question generation job added', { jobId: job.id });
            return job;

        } catch (error) {
            logger.error('Error adding generation job:', error);
            throw error;
        }
    }

    /**
     * Add codebase analysis job
     * @param {Object} data - Job data
     * @returns {Promise<Object>} Job
     */
    async addAnalysisJob(data) {
        if (!this.enabled) {
            logger.warn('Question queue is disabled, skipping analysis job');
            return null;
        }

        try {
            const job = await this.queues.analysis.add('analyze-codebase', data);

            logger.info('Codebase analysis job added', { jobId: job.id });
            return job;

        } catch (error) {
            logger.error('Error adding analysis job:', error);
            throw error;
        }
    }

    /**
     * Add cleanup job
     * @param {Object} data - Job data
     * @returns {Promise<Object>} Job
     */
    async addCleanupJob(data = {}) {
        if (!this.enabled) {
            logger.warn('Question queue is disabled, skipping cleanup job');
            return null;
        }

        try {
            const job = await this.queues.cleanup.add('cleanup-old-questions', data, {
                repeat: {
                    pattern: '0 2 * * *' // Run daily at 2 AM
                }
            });

            logger.info('Cleanup job scheduled', { jobId: job.id });
            return job;

        } catch (error) {
            logger.error('Error adding cleanup job:', error);
            throw error;
        }
    }

    /**
     * Process generation job
     * @private
     */
    async _processGenerationJob(job) {
        const { sessionId, userId, tenantId, context, questionCount, categories } = job.data;

        logger.info('Processing question generation job', {
            jobId: job.id,
            sessionId
        });

        try {
            const questions = await questionGenerator.generateQuestions({
                sessionId,
                userId,
                tenantId,
                context,
                questionCount: questionCount || 5,
                categories: categories || []
            });

            logger.info('Question generation job completed', {
                jobId: job.id,
                questionsGenerated: questions.length
            });

            return { success: true, questions };

        } catch (error) {
            logger.error('Question generation job failed', {
                jobId: job.id,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Process analysis job
     * @private
     */
    async _processAnalysisJob(job) {
        const { workspacePath } = job.data;

        logger.info('Processing codebase analysis job', {
            jobId: job.id,
            workspacePath
        });

        try {
            const codebaseAnalyzer = require('../../core/services/codebase-analyzer.service');
            const analysis = await codebaseAnalyzer.analyzeProject(workspacePath);

            logger.info('Codebase analysis job completed', {
                jobId: job.id
            });

            return { success: true, analysis };

        } catch (error) {
            logger.error('Codebase analysis job failed', {
                jobId: job.id,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Process cleanup job
     * @private
     */
    async _processCleanupJob(job) {
        const { olderThanDays = 30 } = job.data;

        logger.info('Processing cleanup job', {
            jobId: job.id,
            olderThanDays
        });

        try {
            const deletedCount = await questionRepository.deleteOldQuestions(olderThanDays);

            logger.info('Cleanup job completed', {
                jobId: job.id,
                deletedCount
            });

            return { success: true, deletedCount };

        } catch (error) {
            logger.error('Cleanup job failed', {
                jobId: job.id,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Get queue statistics
     * @returns {Promise<Object>} Queue statistics
     */
    async getStats() {
        if (!this.enabled) {
            return { enabled: false };
        }

        try {
            const stats = {};

            for (const [name, queue] of Object.entries(this.queues)) {
                const counts = await queue.getJobCounts();
                stats[name] = counts;
            }

            return { enabled: true, ...stats };

        } catch (error) {
            logger.error('Error getting queue stats:', error);
            return { enabled: true, error: error.message };
        }
    }

    /**
     * Close all queues and workers
     * @returns {Promise<void>}
     */
    async close() {
        try {
            // Close workers
            for (const worker of Object.values(this.workers)) {
                await worker.close();
            }

            // Close queues
            for (const queue of Object.values(this.queues)) {
                await queue.close();
            }

            // Close connection
            if (this.connection) {
                await this.connection.quit();
            }

            logger.info('Question queue closed');

        } catch (error) {
            logger.error('Error closing question queue:', error);
        }
    }
}

module.exports = new QuestionQueue();
