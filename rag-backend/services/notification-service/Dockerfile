FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configs
COPY pnpm-workspace.yaml package.json ./

# Copy packages
COPY packages ./packages

# Copy service
COPY services/notification-service ./services/notification-service

# Install dependencies
RUN pnpm install

# Set workdir to service
WORKDIR /app/services/notification-service

# Expose port
EXPOSE 3005

CMD ["node", "src/index.js"]
