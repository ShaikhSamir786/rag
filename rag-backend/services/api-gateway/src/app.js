const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { logger } = require('@rag-platform/logger');
const { errorHandler } = require('@rag-platform/common');
const { setupRestRoutes } = require('./rest/routes');

const createApp = () => {
    const app = express();

    // Security & Utilities
    app.use(helmet());
    app.use(compression());
    app.use(cors());
    app.use(express.json());

    // Health Check
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', service: 'api-gateway' });
    });

    // Setup REST Routes (Proxies)
    setupRestRoutes(app);

    // Global Error Handler (should be last)
    app.use(errorHandler);

    return app;
};

module.exports = { createApp };
