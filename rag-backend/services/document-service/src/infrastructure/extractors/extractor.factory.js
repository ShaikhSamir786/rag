const PDFExtractor = require('./pdf.extractor');
const DOCXExtractor = require('./docx.extractor');
const TXTExtractor = require('./txt.extractor');
const { logger } = require('@rag-platform/logger');

class ExtractorFactory {
  constructor() {
    this.extractors = new Map();
    this.initializeExtractors();
  }

  initializeExtractors() {
    this.extractors.set('application/pdf', PDFExtractor);
    this.extractors.set('application/msword', DOCXExtractor);
    this.extractors.set('application/vnd.openxmlformats-officedocument.wordprocessingml.document', DOCXExtractor);
    this.extractors.set('text/plain', TXTExtractor);
    this.extractors.set('text/markdown', TXTExtractor);
  }

  getExtractor(mimeType) {
    const ExtractorClass = this.extractors.get(mimeType);
    
    if (!ExtractorClass) {
      logger.warn('No extractor found for MIME type:', mimeType);
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    return new ExtractorClass();
  }

  isSupported(mimeType) {
    return this.extractors.has(mimeType);
  }

  getSupportedTypes() {
    return Array.from(this.extractors.keys());
  }
}

module.exports = new ExtractorFactory();

