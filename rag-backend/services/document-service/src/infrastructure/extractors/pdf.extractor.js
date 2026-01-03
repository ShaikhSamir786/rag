const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const { logger } = require('@rag-platform/logger');

class PDFExtractor {
  async extract(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer, {
        max: 0, // No page limit by default
      });

      return {
        text: pdfData.text,
        metadata: {
          pages: pdfData.numpages,
          info: pdfData.info || {},
          metadata: pdfData.metadata || {},
          version: pdfData.version,
        },
        preview: pdfData.text.substring(0, 1000), // First 1000 chars
      };
    } catch (error) {
      logger.error('PDF extraction error:', error);
      
      // Handle encrypted PDFs
      if (error.message && error.message.includes('encrypted')) {
        throw new Error('PDF is encrypted and cannot be processed');
      }
      
      throw new Error(`Failed to extract PDF: ${error.message}`);
    }
  }

  async extractMetadata(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer, {
        max: 1, // Only read first page for metadata
      });

      return {
        pages: pdfData.numpages,
        info: pdfData.info || {},
        metadata: pdfData.metadata || {},
      };
    } catch (error) {
      logger.error('PDF metadata extraction error:', error);
      throw error;
    }
  }
}

module.exports = PDFExtractor;

