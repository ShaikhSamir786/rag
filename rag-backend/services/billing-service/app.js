const express = require('express');
const { logger } = require('@rag-platform/logger');
const { sequelize } = require('@rag-platform/database');
const { errorHandler } = require('@rag-platform/common');
const routes = require('./src/api/routes');
const { rawBodyMiddleware } = require('./src/core/middlewares/webhook-auth.middleware');

const app = express();

// Middleware for raw body (needed for webhook signature verification)
app.use('/api/webhooks', rawBodyMiddleware);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'billing-service' });
});

// API routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

module.exports = app;



