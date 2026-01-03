const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');

// In a real enterprise setup, this would use Apollo Federation to stitch schemas.
// For now, we define a Gateway schema that acts as an entry point.

const typeDefs = `
  type Query {
    gatewayHealth: String
  }
`;

const resolvers = {
    Query: {
        gatewayHealth: () => 'Gateway GraphQL is healthy',
    },
};

const createGraphQLServer = () => {
    return new ApolloServer({
        typeDefs,
        resolvers,
        // Optional: Add plugins for logging/metrics
    });
};

module.exports = { createGraphQLServer, expressMiddleware };
