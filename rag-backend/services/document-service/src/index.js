const express = require('express');
const { logger } = require('@rag-platform/logger');
const { sequelize } = require('@rag-platform/database');
const { errorHandler } = require('@rag-platform/common');
const { QueueManager } = require('@rag-platform/queue');
const routes = require('./api/routes');
const queueConfig = require('./config/queue');
const DocumentUploadedHandler = require('./workers/handlers/document-uploaded.handler');
const EmbeddingHandler = require('./workers/handlers/embedding.handler');
const { Document } = require('./domain/models/document.model');
const { DocumentChunk } = require('./domain/models/document-chunk.model');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'document-service',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3002;

/**
 * Initialize queue workers
 */
function initializeWorkers() {
  const queueManager = QueueManager.getInstance();

  // Document processing worker
  const documentWorker = queueManager.createWorker(
    queueConfig.queues.documentProcessing.name,
    async (job) => {
      const handler = new DocumentUploadedHandler();
      return await handler.process(job);
    },
    {
      concurrency: 3,
      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  );

  documentWorker.on('completed', (job) => {
    logger.info('Document processing job completed', {
      jobId: job.id,
      documentId: job.data.documentId,
    });
  });

  documentWorker.on('failed', (job, err) => {
    logger.error('Document processing job failed', {
      jobId: job.id,
      documentId: job.data.documentId,
      error: err.message,
    });
  });

  // Embedding worker
  const embeddingWorker = queueManager.createWorker(
    queueConfig.queues.embedding.name,
    async (job) => {
      const handler = new EmbeddingHandler();
      return await handler.process(job);
    },
    {
      concurrency: 5,
      limiter: {
        max: 20,
        duration: 1000,
      },
    }
  );

  embeddingWorker.on('completed', (job) => {
    logger.info('Embedding job completed', {
      jobId: job.id,
      chunkId: job.data.chunkId,
    });
  });

  embeddingWorker.on('failed', (job, err) => {
    logger.error('Embedding job failed', {
      jobId: job.id,
      chunkId: job.data.chunkId,
      error: err.message,
    });
  });

  logger.info('Queue workers initialized');
}

/**
 * Start server
 */
const start = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Sync database models (in production, use migrations)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: false });
      logger.info('Database models synchronized');
    }

    // Initialize workers
    initializeWorkers();
    logger.info('Background workers initialized');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Document Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start service', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

start();
