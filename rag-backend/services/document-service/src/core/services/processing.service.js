const { QueueManager } = require('@rag-platform/queue');
const { Document } = require('../../domain/models/document.model');
const { DocumentChunk } = require('../../domain/models/document-chunk.model');
const ExtractionService = require('./extraction.service');
const chunkerUtil = require('../../utils/chunker.util');
const queueConfig = require('../../config/queue');
const { logger } = require('@rag-platform/logger');

// Check if EventBus is available
let EventBus;
try {
  EventBus = require('@rag-platform/events').EventBus;
} catch (error) {
  // EventBus not available, use no-op
  EventBus = {
    getInstance: () => ({
      emit: () => {},
    }),
  };
}

class ProcessingService {
  constructor() {
    this.extractionService = new ExtractionService();
    this.queue = QueueManager.getInstance().createQueue(queueConfig.queues.documentProcessing.name);
    try {
      this.eventBus = EventBus.getInstance();
    } catch (error) {
      this.eventBus = { emit: () => {} };
    }
  }

  /**
   * Process document: extraction → chunking → embedding
   */
  async processDocument(documentId, filePath, mimeType) {
    const document = await Document.findByPk(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    try {
      // Update status to processing
      await document.update({ status: 'processing' });
      this.eventBus.emit('document.processing.started', { documentId, tenantId: document.tenantId });

      // Step 1: Extract text
      logger.info('Starting text extraction', { documentId });
      const extractionResult = await this.extractionService.extract(filePath, mimeType);

      // Update document with extracted text
      await document.update({
        extractedText: extractionResult.preview,
        metadata: {
          ...document.metadata,
          ...extractionResult.metadata,
        },
      });

      // Step 2: Chunk text
      logger.info('Starting text chunking', { documentId });
      const chunks = chunkerUtil.chunk(extractionResult.text, 'sentence', {
        chunkSize: 1000,
        overlap: 200,
      });

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
            },
          })
        )
      );

      // Update document with chunk count
      await document.update({ chunkCount: chunkRecords.length });

      // Step 3: Queue embedding jobs
      logger.info('Queueing embedding jobs', { documentId, chunkCount: chunkRecords.length });
      const embeddingQueue = QueueManager.getInstance().createQueue(queueConfig.queues.embedding.name);

      for (const chunk of chunkRecords) {
        await embeddingQueue.add('generate-embedding', {
          chunkId: chunk.id,
          documentId: document.id,
          content: chunk.content,
          tenantId: document.tenantId,
        }, {
          priority: queueConfig.priorities.normal,
        });
      }

      // Update embedding status
      await document.update({ embeddingStatus: 'processing' });

      // If all chunks are processed, update status to completed
      // This will be handled by the embedding processor

      this.eventBus.emit('document.processing.chunked', {
        documentId,
        tenantId: document.tenantId,
        chunkCount: chunkRecords.length,
      });

      return {
        documentId,
        chunkCount: chunkRecords.length,
        status: 'processing',
      };
    } catch (error) {
      logger.error('Document processing error:', error);
      await document.update({
        status: 'failed',
        errorMessage: error.message,
      });
      this.eventBus.emit('document.processing.failed', {
        documentId,
        tenantId: document.tenantId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Mark document as completed
   */
  async markDocumentCompleted(documentId) {
    const document = await Document.findByPk(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Check if all chunks have embeddings
    const chunks = await DocumentChunk.findAll({ where: { documentId } });
    const chunksWithEmbeddings = chunks.filter(c => c.embeddingId).length;

    if (chunksWithEmbeddings === chunks.length) {
      await document.update({
        status: 'completed',
        embeddingStatus: 'completed',
      });

      this.eventBus.emit('document.processing.completed', {
        documentId,
        tenantId: document.tenantId,
      });
    }
  }
}

module.exports = ProcessingService;

