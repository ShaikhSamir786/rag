FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configs
COPY pnpm-workspace.yaml package.json ./

# Copy packages
COPY packages ./packages

# Copy service
COPY services/embedding-service ./services/embedding-service

# Install dependencies
RUN pnpm install --frozen-lockfile

# Set workdir to service
WORKDIR /app/services/embedding-service

# Expose port
EXPOSE 3003

CMD ["node", "src/index.js"]
