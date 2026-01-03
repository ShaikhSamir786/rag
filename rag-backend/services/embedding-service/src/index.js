const express = require('express');
const { logger } = require('@rag-platform/logger');
const { errorHandler } = require('@rag-platform/common');
const { setupWorker } = require('./workers/embedding-processor');

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const PORT = process.env.PORT || 3003;

const start = async () => {
  try {
    // Start worker
    setupWorker();
    logger.info('Embedding Worker started');

    app.listen(PORT, () => {
      logger.info(`Embedding Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start service', error);
  }
};

start();
