const { BaseWorker } = require('@rag-platform/queue');
const EmbeddingProcessor = require('../processors/embedding-processor');
const queueConfig = require('../../config/queue');
const { logger } = require('@rag-platform/logger');

class EmbeddingHandler extends BaseWorker {
  constructor() {
    super(queueConfig.queues.embedding.name);
    this.processor = new EmbeddingProcessor();
  }

  async process(job) {
    logger.info('Processing embedding job', { jobId: job.id, data: job.data });
    return await this.processor.process(job);
  }
}

module.exports = EmbeddingHandler;

