const ExtractionService = require('../../core/services/extraction.service');
const { Document } = require('../../domain/models/document.model');
const { logger } = require('@rag-platform/logger');

class ExtractionProcessor {
  constructor() {
    this.extractionService = new ExtractionService();
  }

  /**
   * Extract text from document
   */
  async process(job) {
    const { documentId, filePath, mimeType } = job.data;

    logger.info('Extracting text from document', { documentId, mimeType });

    try {
      const document = await Document.findByPk(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Extract text and metadata
      const result = await this.extractionService.extract(filePath, mimeType);

      // Update document
      await document.update({
        extractedText: result.preview,
        metadata: {
          ...document.metadata,
          ...result.metadata,
        },
        status: 'processing',
      });

      logger.info('Text extraction completed', { documentId, textLength: result.text.length });
      return {
        documentId,
        textLength: result.text.length,
        hasMetadata: !!result.metadata,
      };
    } catch (error) {
      logger.error('Text extraction failed', { documentId, error: error.message });
      
      // Update document status
      try {
        const document = await Document.findByPk(documentId);
        if (document) {
          await document.update({
            status: 'failed',
            errorMessage: error.message,
          });
        }
      } catch (updateError) {
        logger.error('Failed to update document status', updateError);
      }

      throw error;
    }
  }
}

module.exports = ExtractionProcessor;

