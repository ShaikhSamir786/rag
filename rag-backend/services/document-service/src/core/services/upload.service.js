const { fromFile } = require('file-type');
const sharp = require('sharp');
const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const path = require('path');
const StorageService = require('./storage.service');
const { QueueManager } = require('@rag-platform/queue');
const { Document } = require('../../domain/models/document.model');
const queueConfig = require('../../config/queue');
const { logger } = require('@rag-platform/logger');
const { v4: uuidv4 } = require('uuid');

class UploadService {
  constructor() {
    this.storageService = new StorageService();
    this.queue = QueueManager.getInstance().createQueue(queueConfig.queues.documentProcessing.name);
  }

  /**
   * Process uploaded file
   */
  async processUpload(file, userId, tenantId, sessionId = null) {
    try {
      // Validate file type
      const fileType = await fromFile(file.path);
      if (!fileType) {
        throw new Error('Unable to determine file type');
      }

      // Process based on file type
      let metadata = {};
      let processedPath = file.path;

      if (fileType.mime.startsWith('image/')) {
        metadata = await this.processImage(file.path);
        processedPath = metadata.processedPath || file.path;
      } else if (fileType.mime === 'application/pdf') {
        metadata = await this.processPDF(file.path);
      }

      // Upload to permanent storage
      const storageResult = await this.storageService.uploadFile(
        processedPath,
        tenantId,
        userId,
        file.originalname,
        {
          originalName: file.originalname,
          mimeType: fileType.mime,
          size: file.size.toString(),
          ...metadata,
        }
      );

      // Clean up processed file if different from original
      if (processedPath !== file.path) {
        try {
          await fs.unlink(processedPath);
        } catch (err) {
          logger.warn('Failed to delete processed file', err);
        }
      }

      // Create document record
      const document = await Document.create({
        id: uuidv4(),
        tenantId,
        userId,
        filename: file.originalname,
        s3Key: storageResult.key,
        mimetype: fileType.mime,
        size: file.size,
        metadata: {
          ...metadata,
          storageBackend: storageResult.storageBackend,
        },
        status: 'pending',
      });

      // Queue processing job
      await this.queue.add('process-document', {
        documentId: document.id,
        filePath: file.path, // Temporary file path
        mimeType: fileType.mime,
        tenantId,
        userId,
      }, {
        priority: queueConfig.priorities.normal,
      });

      logger.info('File upload processed', {
        documentId: document.id,
        filename: file.originalname,
      });

      return {
        id: document.id,
        filename: file.originalname,
        size: file.size,
        type: fileType.mime,
        status: document.status,
        metadata,
      };
    } catch (error) {
      logger.error('File upload processing error:', error);

      // Clean up temp file
      try {
        await fs.unlink(file.path);
      } catch (err) {
        // Ignore
      }

      throw error;
    }
  }

  /**
   * Process image file
   */
  async processImage(sourcePath) {
    try {
      const image = sharp(sourcePath);
      const imageMetadata = await image.metadata();

      // Resize if too large (max 2000px width)
      if (imageMetadata.width > 2000) {
        const ext = path.extname(sourcePath);
        const processedPath = sourcePath.replace(ext, `_processed${ext}`);
        await image.resize(2000).toFile(processedPath);

        return {
          width: 2000,
          height: Math.round((2000 / imageMetadata.width) * imageMetadata.height),
          originalWidth: imageMetadata.width,
          originalHeight: imageMetadata.height,
          format: imageMetadata.format,
          processedPath,
        };
      }

      return {
        width: imageMetadata.width,
        height: imageMetadata.height,
        format: imageMetadata.format,
      };
    } catch (error) {
      logger.error('Image processing error:', error);
      // Return basic metadata even if processing fails
      return {};
    }
  }

  /**
   * Process PDF file (extract metadata)
   */
  async processPDF(sourcePath) {
    try {
      const dataBuffer = await fs.readFile(sourcePath);
      const pdfData = await pdfParse(dataBuffer);

      return {
        pages: pdfData.numpages,
        textPreview: pdfData.text.substring(0, 1000),
        info: pdfData.info || {},
      };
    } catch (error) {
      logger.error('PDF metadata extraction error:', error);
      // Return empty metadata if extraction fails
      return {};
    }
  }

  /**
   * Clean up temporary file
   */
  async cleanupTempFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.warn('Failed to cleanup temp file', { filePath, error });
    }
  }
}

module.exports = UploadService;

