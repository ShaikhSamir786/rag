const { DocumentChunk } = require('../../domain/models/document-chunk.model');
const EmbeddingServiceClient = require('../../infrastructure/external/embedding-service.client');
const ProcessingService = require('../../core/services/processing.service');
const { logger } = require('@rag-platform/logger');

class EmbeddingProcessor {
  constructor() {
    this.embeddingClient = new EmbeddingServiceClient();
    this.processingService = new ProcessingService();
  }

  /**
   * Generate embedding for chunk
   */
  async process(job) {
    const { chunkId, documentId, content, tenantId } = job.data;

    logger.info('Generating embedding for chunk', { chunkId, documentId });

    try {
      // Generate embedding
      const result = await this.embeddingClient.generateEmbeddingWithRetry(content, {
        chunkId,
        documentId,
        tenantId,
      });

      // Update chunk with embedding ID
      const chunk = await DocumentChunk.findByPk(chunkId);
      if (!chunk) {
        throw new Error('Chunk not found');
      }

      await chunk.update({
        embeddingId: result.embeddingId,
        metadata: {
          ...chunk.metadata,
          embeddingModel: result.model,
        },
      });

      logger.info('Embedding generated and saved', {
        chunkId,
        documentId,
        embeddingId: result.embeddingId,
      });

      // Check if all chunks are processed and mark document as completed
      await this.processingService.markDocumentCompleted(documentId);

      return {
        chunkId,
        embeddingId: result.embeddingId,
      };
    } catch (error) {
      logger.error('Embedding generation failed', {
        chunkId,
        documentId,
        error: error.message,
      });

      // Update chunk to indicate failure (optional)
      try {
        const chunk = await DocumentChunk.findByPk(chunkId);
        if (chunk) {
          await chunk.update({
            metadata: {
              ...chunk.metadata,
              embeddingError: error.message,
            },
          });
        }
      } catch (updateError) {
        logger.error('Failed to update chunk with error', updateError);
      }

      throw error;
    }
  }
}

module.exports = EmbeddingProcessor;

