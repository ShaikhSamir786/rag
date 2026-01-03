const extractorFactory = require('../../infrastructure/extractors/extractor.factory');
const extractionConfig = require('../../config/extraction');
const { logger } = require('@rag-platform/logger');

class ExtractionService {
  /**
   * Extract text and metadata from file
   */
  async extract(filePath, mimeType) {
    try {
      // Check if file type is supported
      if (!extractorFactory.isSupported(mimeType)) {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Get extractor
      const extractor = extractorFactory.getExtractor(mimeType);

      // Check file size limit
      const typeConfig = extractionConfig.supportedTypes[mimeType];
      if (typeConfig) {
        const fs = require('fs');
        const stats = fs.statSync(filePath);
        if (stats.size > typeConfig.maxSize) {
          throw new Error(`File size exceeds limit: ${typeConfig.maxSize} bytes`);
        }
      }

      // Extract text and metadata
      const result = await extractor.extract(filePath);

      logger.info('Text extraction completed', {
        mimeType,
        textLength: result.text.length,
        hasMetadata: !!result.metadata,
      });

      return {
        text: result.text,
        metadata: result.metadata || {},
        preview: result.preview || result.text.substring(0, 1000),
      };
    } catch (error) {
      logger.error('Extraction service error:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  /**
   * Extract metadata only
   */
  async extractMetadata(filePath, mimeType) {
    try {
      if (!extractorFactory.isSupported(mimeType)) {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      const extractor = extractorFactory.getExtractor(mimeType);
      const metadata = await extractor.extractMetadata(filePath);

      return metadata;
    } catch (error) {
      logger.error('Metadata extraction error:', error);
      throw error;
    }
  }

  /**
   * Check if file type is supported
   */
  isSupported(mimeType) {
    return extractorFactory.isSupported(mimeType);
  }

  /**
   * Get supported file types
   */
  getSupportedTypes() {
    return extractorFactory.getSupportedTypes();
  }
}

module.exports = ExtractionService;

