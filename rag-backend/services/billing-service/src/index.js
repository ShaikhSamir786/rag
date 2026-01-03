const app = require('../app');
const { logger } = require('@rag-platform/logger');
const { sequelize } = require('@rag-platform/database');
const { initializeWorkers } = require('./workers/billing-workers');

// Load models
require('./domain/models/order.model');
require('./domain/models/transaction.model');
require('./domain/models/payment-intent.model');
require('./domain/models/refund.model');
require('./domain/models/webhook-event.model');
require('./domain/models/invoice.model');

const PORT = process.env.PORT || 3003;

async function startServer() {
    try {
        // Test database connection
        await sequelize.authenticate();
        logger.info('Database connection established');

        // Sync database (in production, use migrations)
        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: false });
            logger.info('Database models synchronized');
        }

        // Initialize workers
        initializeWorkers();
        logger.info('Background workers initialized');

        // Start server
        app.listen(PORT, () => {
            logger.info(`Billing Service running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start server', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

// Handle graceful shutdown
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

startServer();
