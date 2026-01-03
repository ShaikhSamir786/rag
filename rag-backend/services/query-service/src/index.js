const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { logger } = require('@rag-platform/logger');
const { errorHandler } = require('@rag-platform/common');
const queryRoutes = require('./api/routes/query.routes');
const { QueryService } = require('./core/services/query.service');

const typeDefs = `
  type Query {
    ask(question: String!): Answer
  }
  type Answer {
    text: String
    sources: [String]
  }
`;

const resolvers = {
  Query: {
    ask: async (_, { question }) => {
      const service = new QueryService();
      // Placeholder for actual logic calling service.question(question)
      return { text: `Answer to: ${question}`, sources: ['doc1'] };
    },
  },
};

const app = express();
app.use(express.json());

// REST Fallback
app.use('/query', queryRoutes);

const startServer = async () => {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use('/graphql', expressMiddleware(server));
  app.use(errorHandler);

  const PORT = process.env.PORT || 3004;
  app.listen(PORT, () => {
    logger.info(`Query Service (GraphQL+REST) running on port ${PORT}`);
  });
};

startServer();
