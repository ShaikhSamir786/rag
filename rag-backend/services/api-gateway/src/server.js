const http = require('http');
const { createApp } = require('./app');
const { logger } = require('@rag-platform/logger');
const { Server } = require('socket.io');
const { createGraphQLServer, expressMiddleware } = require('./graphql/gateway');
const { handleChat } = require('./websocket/handlers/chat.handler');

const startServer = async () => {
    try {
        const app = createApp();
        const httpServer = http.createServer(app);

        // --- WebSocket Setup ---
        const io = new Server(httpServer, {
            cors: { origin: '*' },
            path: '/ws' // Gateway WS path
        });

        io.on('connection', (socket) => {
            logger.info(`WS Client connected: ${socket.id}`);
            handleChat(io, socket);
        });

        // --- GraphQL Setup ---
        const graphqlServer = createGraphQLServer();
        await graphqlServer.start();
        app.use('/graphql', expressMiddleware(graphqlServer));

        // Start Server
        const PORT = process.env.PORT || 3000;
        httpServer.listen(PORT, () => {
            logger.info(`API Gateway running on port ${PORT}`);
            logger.info(`REST API: http://localhost:${PORT}/api/v1/*`);
            logger.info(`GraphQL: http://localhost:${PORT}/graphql`);
            logger.info(`WebSocket: http://localhost:${PORT}/ws`);
        });

    } catch (error) {
        logger.error('Failed to start API Gateway', error);
        process.exit(1);
    }
};

startServer();
