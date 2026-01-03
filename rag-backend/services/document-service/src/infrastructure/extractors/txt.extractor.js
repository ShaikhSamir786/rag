const fs = require('fs').promises;
const { logger } = require('@rag-platform/logger');

class TXTExtractor {
  async extract(filePath, encoding = 'utf-8') {
    try {
      const content = await fs.readFile(filePath, encoding);
      
      return {
        text: content,
        metadata: {
          encoding: encoding,
          length: content.length,
          lineCount: content.split('\n').length,
        },
        preview: content.substring(0, 1000), // First 1000 chars
      };
    } catch (error) {
      logger.error('TXT extraction error:', error);
      
      // Try with different encoding if UTF-8 fails
      if (encoding === 'utf-8') {
        try {
          return await this.extract(filePath, 'latin1');
        } catch (retryError) {
          throw new Error(`Failed to extract text file: ${error.message}`);
        }
      }
      
      throw new Error(`Failed to extract text file: ${error.message}`);
    }
  }

  async extractMetadata(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      
      return {
        size: stats.size,
        encoding: 'utf-8',
        lineCount: content.split('\n').length,
        wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
      };
    } catch (error) {
      logger.error('TXT metadata extraction error:', error);
      throw error;
    }
  }
}

module.exports = TXTExtractor;

