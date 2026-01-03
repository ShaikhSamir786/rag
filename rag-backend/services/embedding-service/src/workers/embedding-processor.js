const { Worker } = require('bullmq');
const { EmbeddingService } = require('../core/services/embedding.service');
const { logger } = require('@rag-platform/logger');

const embeddingService = new EmbeddingService();

const setupWorker = () => {
    const worker = new Worker('embedding-processing', async (job) => {
        const { documentId, chunks, tenantId } = job.data;
        logger.info(\`Processing embedding for document \${documentId}\`);

    const vectors = [];
    for (let i = 0; i < chunks.length; i++) {
        const embedding = await embeddingService.createEmbedding(chunks[i]);
        vectors.push({
            id: \`\${documentId}-\${i}\`,
            values: embedding,
            metadata: {
                text: chunks[i],
                documentId,
                chunkIndex: i
            }
        });
    }

    await embeddingService.storeEmbeddings(vectors, tenantId);
    logger.info(\`Embeddings stored for document \${documentId}\`);
  }, {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: 6379
    }
  });

  return worker;
};

module.exports = { setupWorker };
