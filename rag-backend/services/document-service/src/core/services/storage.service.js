const storageConfig = require('../../config/storage');
const S3StorageClient = require('../../infrastructure/storage/s3.client');
const LocalStorageClient = require('../../infrastructure/storage/local.storage');
const { logger } = require('@rag-platform/logger');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class StorageService {
  constructor() {
    this.backend = storageConfig.backend;
    
    if (this.backend === 's3') {
      this.client = new S3StorageClient();
    } else {
      this.client = new LocalStorageClient();
    }
  }

  /**
   * Upload file
   */
  async uploadFile(sourcePath, tenantId, userId, originalFilename, metadata = {}) {
    const ext = path.extname(originalFilename);
    const filename = `${uuidv4()}${ext}`;
    const key = `${tenantId}/${userId}/${filename}`;

    if (this.backend === 's3') {
      await this.client.uploadFile(sourcePath, key, metadata);
      return { key, filename, storageBackend: 's3' };
    } else {
      const result = await this.client.uploadFile(sourcePath, tenantId, userId, filename, metadata);
      return { key: result.key, filename, path: result.path, storageBackend: 'local' };
    }
  }

  /**
   * Upload buffer
   */
  async uploadBuffer(buffer, tenantId, userId, originalFilename, contentType, metadata = {}) {
    const ext = path.extname(originalFilename);
    const filename = `${uuidv4()}${ext}`;
    const key = `${tenantId}/${userId}/${filename}`;

    if (this.backend === 's3') {
      await this.client.uploadBuffer(buffer, key, contentType, metadata);
      return { key, filename, storageBackend: 's3' };
    } else {
      const result = await this.client.uploadBuffer(buffer, tenantId, userId, filename, metadata);
      return { key: result.key, filename, path: result.path, storageBackend: 'local' };
    }
  }

  /**
   * Download file
   */
  async downloadFile(key) {
    if (this.backend === 's3') {
      return await this.client.downloadFile(key);
    } else {
      const fullPath = path.join(storageConfig.local.basePath, key);
      return await this.client.downloadFile(fullPath);
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(key) {
    if (this.backend === 's3') {
      return await this.client.fileExists(key);
    } else {
      const fullPath = path.join(storageConfig.local.basePath, key);
      return await this.client.fileExists(fullPath);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(key) {
    if (this.backend === 's3') {
      return await this.client.deleteFile(key);
    } else {
      const fullPath = path.join(storageConfig.local.basePath, key);
      return await this.client.deleteFile(fullPath);
    }
  }

  /**
   * Get file URL
   */
  async getFileUrl(key) {
    if (this.backend === 's3') {
      return await this.client.getPresignedUrl(key);
    } else {
      const fullPath = path.join(storageConfig.local.basePath, key);
      return await this.client.getFileUrl(fullPath);
    }
  }
}

module.exports = StorageService;

