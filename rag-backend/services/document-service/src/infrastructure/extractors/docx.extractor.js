const mammoth = require('mammoth');
const fs = require('fs').promises;
const { logger } = require('@rag-platform/logger');

class DOCXExtractor {
  async extract(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      
      // Extract text
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;

      // Extract with HTML for metadata (if needed)
      const htmlResult = await mammoth.convertToHtml({ buffer });
      
      // Get document metadata if available
      const metadata = {
        messages: result.messages || [],
        hasFormatting: htmlResult.value.length > text.length,
      };

      return {
        text: text,
        metadata: metadata,
        preview: text.substring(0, 1000), // First 1000 chars
      };
    } catch (error) {
      logger.error('DOCX extraction error:', error);
      throw new Error(`Failed to extract DOCX: ${error.message}`);
    }
  }

  async extractMetadata(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      
      return {
        wordCount: result.value.split(/\s+/).length,
        messages: result.messages || [],
      };
    } catch (error) {
      logger.error('DOCX metadata extraction error:', error);
      throw error;
    }
  }
}

module.exports = DOCXExtractor;

