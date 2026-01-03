const { logger } = require('@rag-platform/logger');

class ChunkerUtil {
  /**
   * Fixed-size chunking with overlap
   */
  fixedSizeChunk(text, chunkSize = 1000, overlap = 200) {
    if (!text || text.length === 0) {
      return [];
    }

    const chunks = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.substring(start, end).trim();

      if (chunk.length > 0) {
        chunks.push({
          content: chunk,
          startIndex: start,
          endIndex: end,
        });
      }

      // Move start position with overlap
      start = end - overlap;
      if (start >= text.length) break;
    }

    return chunks;
  }

  /**
   * Sentence-aware chunking
   */
  sentenceAwareChunk(text, maxChunkSize = 1000, overlap = 200) {
    if (!text || text.length === 0) {
      return [];
    }

    // Split by sentence endings
    const sentenceEndings = /[.!?]\s+/g;
    const sentences = text.split(sentenceEndings);
    const chunks = [];
    let currentChunk = '';
    let startIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (sentence.length === 0) continue;

      // If adding this sentence would exceed max size, save current chunk
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          startIndex: startIndex,
          endIndex: startIndex + currentChunk.length,
        });

        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, overlap);
        currentChunk = overlapText + sentence;
        startIndex = startIndex + currentChunk.length - overlapText.length - sentence.length;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }

    // Add remaining chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        startIndex: startIndex,
        endIndex: startIndex + currentChunk.length,
      });
    }

    return chunks;
  }

  /**
   * Paragraph-based chunking
   */
  paragraphChunk(text, maxChunkSize = 1000, overlap = 200) {
    if (!text || text.length === 0) {
      return [];
    }

    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    let startIndex = 0;

    for (const paragraph of paragraphs) {
      const trimmedPara = paragraph.trim();

      if (currentChunk.length + trimmedPara.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          startIndex: startIndex,
          endIndex: startIndex + currentChunk.length,
        });

        const overlapText = this.getOverlapText(currentChunk, overlap);
        currentChunk = overlapText + '\n\n' + trimmedPara;
        startIndex = startIndex + currentChunk.length - overlapText.length - trimmedPara.length - 2;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        startIndex: startIndex,
        endIndex: startIndex + currentChunk.length,
      });
    }

    return chunks;
  }

  /**
   * Token-aware chunking (approximate)
   */
  tokenAwareChunk(text, maxTokens = 500, overlapTokens = 50) {
    // Approximate: 1 token ≈ 4 characters
    const chunkSize = maxTokens * 4;
    const overlapSize = overlapTokens * 4;

    return this.fixedSizeChunk(text, chunkSize, overlapSize);
  }

  /**
   * Get overlap text from end of chunk
   */
  getOverlapText(text, overlapSize) {
    if (text.length <= overlapSize) {
      return text;
    }

    // Try to get overlap at sentence boundary
    const overlapText = text.substring(text.length - overlapSize);
    const sentenceStart = overlapText.search(/[.!?]\s+/);

    if (sentenceStart > 0) {
      return overlapText.substring(sentenceStart + 2); // +2 for sentence ending and space
    }

    // Fallback to word boundary
    const wordStart = overlapText.search(/\s+/);
    if (wordStart > 0) {
      return overlapText.substring(wordStart + 1);
    }

    return overlapText;
  }

  /**
   * Estimate token count (rough approximation)
   */
  estimateTokenCount(text) {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Chunk text with specified strategy
   */
  chunk(text, strategy = 'fixed', options = {}) {
    const {
      chunkSize = 1000,
      overlap = 200,
      maxTokens = 500,
      overlapTokens = 50,
    } = options;

    switch (strategy) {
      case 'fixed':
        return this.fixedSizeChunk(text, chunkSize, overlap);
      case 'sentence':
        return this.sentenceAwareChunk(text, chunkSize, overlap);
      case 'paragraph':
        return this.paragraphChunk(text, chunkSize, overlap);
      case 'token':
        return this.tokenAwareChunk(text, maxTokens, overlapTokens);
      default:
        logger.warn(`Unknown chunking strategy: ${strategy}, using fixed`);
        return this.fixedSizeChunk(text, chunkSize, overlap);
    }
  }
}

module.exports = new ChunkerUtil();

