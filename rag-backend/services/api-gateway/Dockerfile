FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configs
COPY pnpm-workspace.yaml package.json ./

# Copy packages
COPY packages ./packages

# Copy service
COPY services/api-gateway ./services/api-gateway

# Install dependencies
RUN pnpm install --frozen-lockfile

# Set workdir to service
WORKDIR /app/services/api-gateway

# Expose port
EXPOSE 3000

CMD ["node", "src/server.js"]
