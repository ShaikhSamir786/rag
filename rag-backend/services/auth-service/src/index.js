const express = require('express');
const cookieParser = require('cookie-parser');
const { logger } = require('@rag-platform/logger');
const { sequelize } = require('@rag-platform/database');
const { errorHandler } = require('@rag-platform/common');
const authRoutes = require('./api/routes/auth.routes');

// Load models to ensure they're registered with Sequelize
require('./domain/models/user.model');
require('./domain/models/otp.model');
require('./domain/models/session.model');
require('./domain/models/oauth-account.model');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

const start = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Database connected');

        // Sync models (for dev only)
        await sequelize.sync();

        app.listen(PORT, () => {
            logger.info(`Auth Service running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start service', error);
        process.exit(1);
    }
};

start();
