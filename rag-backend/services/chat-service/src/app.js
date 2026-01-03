const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { logger } = require('@rag-platform/logger');
const { errorHandler } = require('@rag-platform/common');
const config = require('./config');
const routes = require('./api/routes');

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/', routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Error handler
app.use(errorHandler);

module.exports = app;
