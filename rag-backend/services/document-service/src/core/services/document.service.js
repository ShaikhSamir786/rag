const DocumentRepository = require('../repositories/document.repository');
const UploadService = require('./upload.service');
const StorageService = require('./storage.service');
const { logger } = require('@rag-platform/logger');

class DocumentService {
  constructor() {
    this.repository = new DocumentRepository();
    this.uploadService = new UploadService();
    this.storageService = new StorageService();
  }

  /**
   * Upload document
   */
  async upload(file, userId, tenantId, sessionId = null) {
    try {
      const result = await this.uploadService.processUpload(file, userId, tenantId, sessionId);
      return result;
    } catch (error) {
      logger.error('Document upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple documents
   */
  async uploadMultiple(files, userId, tenantId, sessionId = null) {
    const results = await Promise.all(
      files.map(file => this.upload(file, userId, tenantId, sessionId))
    );
    return results;
  }

  /**
   * Get document by ID
   */
  async getById(id, tenantId) {
    const document = await this.repository.findById(id, tenantId);
    if (!document) {
      throw new Error('Document not found');
    }
    return document;
  }

  /**
   * Get document with chunks
   */
  async getByIdWithChunks(id, tenantId) {
    const document = await this.repository.findByIdWithChunks(id, tenantId);
    if (!document) {
      throw new Error('Document not found');
    }
    return document;
  }

  /**
   * List documents
   */
  async list(options = {}) {
    return await this.repository.findAll(options);
  }

  /**
   * Get document chunks
   */
  async getChunks(documentId, tenantId) {
    return await this.repository.getChunks(documentId, tenantId);
  }

  /**
   * Delete document
   */
  async delete(id, userId, tenantId) {
    const document = await this.repository.findById(id, tenantId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Verify ownership
    if (document.userId !== userId) {
      throw new Error('Unauthorized: Document does not belong to user');
    }

    // Delete from storage
    try {
      await this.storageService.deleteFile(document.s3Key);
    } catch (error) {
      logger.warn('Failed to delete file from storage', { s3Key: document.s3Key, error });
    }

    // Delete from database (cascade will delete chunks)
    await this.repository.delete(id, tenantId);

    return true;
  }

  /**
   * Get document status
   */
  async getStatus(id, tenantId) {
    const document = await this.repository.findById(id, tenantId);
    if (!document) {
      throw new Error('Document not found');
    }

    return {
      id: document.id,
      status: document.status,
      embeddingStatus: document.embeddingStatus,
      chunkCount: document.chunkCount,
      errorMessage: document.errorMessage,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  /**
   * Get document statistics
   */
  async getStatistics(tenantId, userId = null) {
    const counts = await this.repository.countByStatus(tenantId, userId);
    return {
      pending: counts.pending || 0,
      processing: counts.processing || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    };
  }
}

module.exports = { DocumentService };
