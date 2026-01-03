const fs = require('fs').promises;
const path = require('path');
const storageConfig = require('../../config/storage');
const { logger } = require('@rag-platform/logger');

class CleanupProcessor {
  /**
   * Clean up temporary files
   */
  async process(job) {
    const { filePath, documentId } = job.data;

    logger.info('Cleaning up temporary files', { documentId, filePath });

    try {
      // Delete temporary file
      if (filePath) {
        try {
          await fs.unlink(filePath);
          logger.info('Temporary file deleted', { filePath });
        } catch (error) {
          if (error.code !== 'ENOENT') {
            logger.warn('Failed to delete temp file', { filePath, error: error.message });
          }
        }
      }

      return { success: true };
    } catch (error) {
      logger.error('Cleanup failed', { documentId, error: error.message });
      throw error;
    }
  }

  /**
   * Clean up old temporary files
   */
  async cleanupOldTempFiles() {
    const tempDir = storageConfig.upload.tempDir;
    const cleanupAfterHours = storageConfig.upload.cleanupAfterHours || 24;
    const cleanupAfterMs = cleanupAfterHours * 60 * 60 * 1000;

    try {
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        try {
          const stats = await fs.stat(filePath);
          const age = now - stats.mtimeMs;

          if (age > cleanupAfterMs) {
            await fs.unlink(filePath);
            cleanedCount++;
          }
        } catch (error) {
          logger.warn('Failed to process file during cleanup', { filePath, error: error.message });
        }
      }

      logger.info('Temp file cleanup completed', { cleanedCount });
      return { cleanedCount };
    } catch (error) {
      logger.error('Temp file cleanup error', error);
      throw error;
    }
  }
}

module.exports = CleanupProcessor;

