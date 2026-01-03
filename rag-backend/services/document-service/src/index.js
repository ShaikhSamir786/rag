const express = require('express');
const { logger } = require('@rag-platform/logger');
const { sequelize } = require('@rag-platform/database');
const { errorHandler } = require('@rag-platform/common');
const documentRoutes = require('./api/routes/document.routes');

const app = express();

app.use(express.json());
app.use('/documents', documentRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 3002;

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, () => {
      logger.info(`Document Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start service', error);
  }
};

start();
