const ProcessingService = require('../../core/services/processing.service');
const StorageService = require('../../core/services/storage.service');
const { logger } = require('@rag-platform/logger');
const fs = require('fs').promises;

class DocumentProcessor {
  constructor() {
    this.processingService = new ProcessingService();
    this.storageService = new StorageService();
  }

  /**
   * Process document job
   */
  async process(job) {
    const { documentId, filePath, mimeType, tenantId, userId } = job.data;

    logger.info('Processing document', { documentId, mimeType });

    try {
      // Process document: extraction → chunking → embedding queue
      const result = await this.processingService.processDocument(documentId, filePath, mimeType);

      // Clean up temporary file
      try {
        await fs.unlink(filePath);
      } catch (error) {
        logger.warn('Failed to delete temp file', { filePath, error });
      }

      logger.info('Document processing completed', { documentId, result });
      return result;
    } catch (error) {
      logger.error('Document processing failed', { documentId, error: error.message });
      throw error;
    }
  }
}

module.exports = DocumentProcessor;

