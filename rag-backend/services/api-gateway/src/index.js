const express = require('express');
const http = require('http');
const cors = require('cors');
const { logger } = require('@rag-platform/logger');
const { errorHandler } = require('@rag-platform/common');
const routes = require('./api/routes');
const { createGraphQLServer, expressMiddleware } = require('./graphql/server');
const { setupWebSocket } = require('./websocket/server');

const app = express();
const httpServer = http.createServer(app);

// Middlewares
app.use(cors());
app.use(express.json());

// WebSocket
setupWebSocket(httpServer);

// GraphQL
const startServer = async () => {
    const graphqlServer = createGraphQLServer();
    await graphqlServer.start();

    app.use('/graphql', expressMiddleware(graphqlServer));

    // REST Routes
    app.use('/api/v1', routes);

    // Error Handler
    app.use(errorHandler);

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
        logger.info(\`API Gateway running on port \${PORT}\`);
    logger.info(\`GraphQL ready at http://localhost:\${PORT}/graphql\`);
  });
};

startServer().catch(err => {
  logger.error('Failed to start Gateway', err);
});
