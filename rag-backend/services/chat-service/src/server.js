const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config');
const { logger } = require('@rag-platform/logger');
const databaseConnection = require('./infrastructure/database/connection');
const sessionCache = require('./infrastructure/cache/session-cache');
const messageCache = require('./infrastructure/cache/message-cache');
const chatQueue = require('./infrastructure/queue/chat-queue');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST']
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join_session', (sessionId) => {
        socket.join(sessionId);
        logger.info(`Socket ${socket.id} joined session ${sessionId}`);
    });

    socket.on('leave_session', (sessionId) => {
        socket.leave(sessionId);
        logger.info(`Socket ${socket.id} left session ${sessionId}`);
    });

    socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
    });
});

// Make io available to the app
app.set('io', io);

// Graceful shutdown
const gracefulShutdown = async () => {
    logger.info('Shutting down gracefully...');

    // Close server
    server.close(() => {
        logger.info('HTTP server closed');
    });

    // Close database connection
    try {
        await databaseConnection.disconnect();
        await sessionCache.disconnect();
        await messageCache.disconnect();
        await chatQueue.close();
        logger.info('All connections closed');
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Initialize and start server
async function startServer() {
    try {
        // Connect to database
        await databaseConnection.connect();
        logger.info('Database connected');

        // Connect to caches
        await sessionCache.connect();
        await messageCache.connect();
        logger.info('Caches connected');

        // Initialize queue
        await chatQueue.initialize();
        logger.info('Queue initialized');

        // Start server
        const PORT = config.port;
        server.listen(PORT, () => {
            logger.info(`Chat Service running on port ${PORT}`);
            logger.info(`Environment: ${config.env}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start if this file is run directly
if (require.main === module) {
    startServer();
}

module.exports = { server, io, startServer };
