const fs = require('fs').promises;
const path = require('path');
const storageConfig = require('../../config/storage');
const { logger } = require('@rag-platform/logger');

class LocalStorageClient {
  constructor() {
    this.basePath = storageConfig.local.basePath;
    this.preserveStructure = storageConfig.local.preserveStructure;
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      logger.error('Failed to create directory:', error);
      throw error;
    }
  }

  /**
   * Get storage path for file
   */
  getStoragePath(tenantId, userId, filename) {
    if (this.preserveStructure) {
      return path.join(this.basePath, tenantId, userId, filename);
    }
    return path.join(this.basePath, filename);
  }

  /**
   * Upload file to local storage
   */
  async uploadFile(sourcePath, tenantId, userId, filename, metadata = {}) {
    try {
      const destPath = this.getStoragePath(tenantId, userId, filename);
      const destDir = path.dirname(destPath);

      await this.ensureDirectory(destDir);

      // Copy file to destination
      await fs.copyFile(sourcePath, destPath);

      // Store metadata in separate file if needed
      if (Object.keys(metadata).length > 0) {
        const metadataPath = destPath + '.metadata.json';
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      }

      logger.info('File uploaded to local storage', { destPath });
      return { path: destPath, key: path.relative(this.basePath, destPath) };
    } catch (error) {
      logger.error('Local storage upload error:', error);
      throw new Error(`Failed to upload file to local storage: ${error.message}`);
    }
  }

  /**
   * Upload buffer to local storage
   */
  async uploadBuffer(buffer, tenantId, userId, filename, metadata = {}) {
    try {
      const destPath = this.getStoragePath(tenantId, userId, filename);
      const destDir = path.dirname(destPath);

      await this.ensureDirectory(destDir);

      await fs.writeFile(destPath, buffer);

      if (Object.keys(metadata).length > 0) {
        const metadataPath = destPath + '.metadata.json';
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      }

      logger.info('Buffer uploaded to local storage', { destPath });
      return { path: destPath, key: path.relative(this.basePath, destPath) };
    } catch (error) {
      logger.error('Local storage buffer upload error:', error);
      throw new Error(`Failed to upload buffer to local storage: ${error.message}`);
    }
  }

  /**
   * Download file from local storage
   */
  async downloadFile(filePath) {
    try {
      const content = await fs.readFile(filePath);
      return content;
    } catch (error) {
      logger.error('Local storage download error:', error);
      throw new Error(`Failed to download file from local storage: ${error.message}`);
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete file from local storage
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);

      // Delete metadata file if exists
      const metadataPath = filePath + '.metadata.json';
      try {
        await fs.unlink(metadataPath);
      } catch {
        // Metadata file doesn't exist, ignore
      }

      logger.info('File deleted from local storage', { filePath });
      return true;
    } catch (error) {
      logger.error('Local storage delete error:', error);
      throw new Error(`Failed to delete file from local storage: ${error.message}`);
    }
  }

  /**
   * Get file URL (for local storage, return path)
   */
  async getFileUrl(filePath) {
    return `/files/${path.relative(this.basePath, filePath)}`;
  }
}

module.exports = LocalStorageClient;

