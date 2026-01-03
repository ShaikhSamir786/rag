const { Document } = require('../../domain/models/document.model');
const { DocumentChunk } = require('../../domain/models/document-chunk.model');
const chunkerUtil = require('../../utils/chunker.util');
const { QueueManager } = require('@rag-platform/queue');
const queueConfig = require('../../config/queue');
const { logger } = require('@rag-platform/logger');

class ChunkingProcessor {
  constructor() {
    this.embeddingQueue = QueueManager.getInstance().createQueue(queueConfig.queues.embedding.name);
  }

  /**
   * Chunk document text
   */
  async process(job) {
    const { documentId, text, chunkingStrategy = 'sentence', chunkSize = 1000, overlap = 200 } = job.data;

    logger.info('Chunking document text', { documentId, strategy: chunkingStrategy });

    try {
      const document = await Document.findByPk(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Generate chunks
      const chunks = chunkerUtil.chunk(text, chunkingStrategy, {
        chunkSize,
        overlap,
      });

      logger.info('Chunks generated', { documentId, chunkCount: chunks.length });

      // Create chunk records
      const chunkRecords = await Promise.all(
        chunks.map((chunk, index) =>
          DocumentChunk.create({
            documentId: document.id,
            chunkIndex: index,
            content: chunk.content,
            tokenCount: chunkerUtil.estimateTokenCount(chunk.content),
            metadata: {
              startIndex: chunk.startIndex,
              endIndex: chunk.endIndex,
              strategy: chunkingStrategy,
            },
          })
        )
      );

      // Update document with chunk count
      await document.update({ chunkCount: chunkRecords.length });

      // Queue embedding jobs for each chunk
      for (const chunk of chunkRecords) {
        await this.embeddingQueue.add('generate-embedding', {
          chunkId: chunk.id,
          documentId: document.id,
          content: chunk.content,
          tenantId: document.tenantId,
        }, {
          priority: queueConfig.priorities.normal,
        });
      }

      logger.info('Chunking completed and embedding jobs queued', {
        documentId,
        chunkCount: chunkRecords.length,
      });

      return {
        documentId,
        chunkCount: chunkRecords.length,
      };
    } catch (error) {
      logger.error('Chunking failed', { documentId, error: error.message });
      throw error;
    }
  }
}

module.exports = ChunkingProcessor;

