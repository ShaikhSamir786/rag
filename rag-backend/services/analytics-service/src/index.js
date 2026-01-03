const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { logger } = require('@rag-platform/logger');

const { connectTimescaleDB } = require('./config/database');

const typeDefs = `
  type Query {
    getStats: Stats
  }
  type Stats {
    totalQueries: Int
    activeUsers: Int
  }
`;

const resolvers = {
  Query: {
    getStats: () => ({ totalQueries: 100, activeUsers: 10 }),
  },
};

const app = express();
app.use(express.json());

const startServer = async () => {
  // Connect to TimescaleDB
  await connectTimescaleDB();

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use('/graphql', expressMiddleware(server));

  const PORT = process.env.PORT || 3005;
  app.listen(PORT, () => {
    logger.info(`Analytics Service (GraphQL Only) running on port ${PORT}`);
  });
};

startServer();
