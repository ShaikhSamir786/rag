const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');

const typeDefs = \`
  type Query {
    hello: String
  }
\`;

const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL',
  },
};

const createGraphQLServer = () => {
  return new ApolloServer({
    typeDefs,
    resolvers,
  });
};

module.exports = { createGraphQLServer, expressMiddleware };
