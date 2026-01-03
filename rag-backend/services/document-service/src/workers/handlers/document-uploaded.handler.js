const { BaseWorker } = require('@rag-platform/queue');
const DocumentProcessor = require('../processors/document-processor');
const queueConfig = require('../../config/queue');
const { logger } = require('@rag-platform/logger');

class DocumentUploadedHandler extends BaseWorker {
  constructor() {
    super(queueConfig.queues.documentProcessing.name);
    this.processor = new DocumentProcessor();
  }

  async process(job) {
    logger.info('Processing document upload job', { jobId: job.id, data: job.data });
    return await this.processor.process(job);
  }
}

module.exports = DocumentUploadedHandler;

