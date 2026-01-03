FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configs
COPY pnpm-workspace.yaml package.json ./

# Copy packages
COPY packages ./packages

# Copy service
COPY services/chat-service ./services/chat-service

# Install dependencies (from root to link workspace packages)
RUN pnpm install

# Set workdir to service
WORKDIR /app/services/chat-service

# Expose port
EXPOSE 3008

# Cmd (overridden by docker-compose usually)
CMD ["node", "src/index.js"]
