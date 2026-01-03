const axios = require('axios');
const { logger } = require('@rag-platform/logger');

class EmbeddingServiceClient {
  constructor() {
    this.baseURL = process.env.EMBEDDING_SERVICE_URL || 'http://embedding-service:3003';
    this.timeout = parseInt(process.env.EMBEDDING_SERVICE_TIMEOUT || '30000');
    this.maxRetries = parseInt(process.env.EMBEDDING_SERVICE_MAX_RETRIES || '3');
  }

  /**
   * Generate embedding for a single chunk
   */
  async generateEmbedding(text, metadata = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/embeddings/generate`,
        {
          text,
          metadata,
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        embedding: response.data.embedding,
        embeddingId: response.data.embeddingId,
        model: response.data.model,
      };
    } catch (error) {
      logger.error('Embedding generation error:', error);
      
      if (error.response) {
        throw new Error(`Embedding service error: ${error.response.data?.error || error.response.statusText}`);
      }
      
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple chunks (batch)
   */
  async generateEmbeddingsBatch(texts, metadata = []) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/embeddings/batch`,
        {
          texts,
          metadata: metadata.length > 0 ? metadata : texts.map(() => ({})),
        },
        {
          timeout: this.timeout * 2, // Longer timeout for batch
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.embeddings.map((item, index) => ({
        embedding: item.embedding,
        embeddingId: item.embeddingId,
        model: item.model,
        index,
      }));
    } catch (error) {
      logger.error('Batch embedding generation error:', error);
      
      if (error.response) {
        throw new Error(`Embedding service error: ${error.response.data?.error || error.response.statusText}`);
      }
      
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  /**
   * Generate embedding with retry logic
   */
  async generateEmbeddingWithRetry(text, metadata = {}, retries = 0) {
    try {
      return await this.generateEmbedding(text, metadata);
    } catch (error) {
      if (retries < this.maxRetries) {
        logger.warn(`Retrying embedding generation (attempt ${retries + 1}/${this.maxRetries})`);
        await this.delay(1000 * (retries + 1)); // Exponential backoff
        return await this.generateEmbeddingWithRetry(text, metadata, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      logger.error('Embedding service health check failed:', error);
      return false;
    }
  }
}

module.exports = EmbeddingServiceClient;

