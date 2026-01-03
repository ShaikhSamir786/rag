FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configs
COPY pnpm-workspace.yaml package.json ./

# Copy packages
COPY packages ./packages
RUN ls -la packages && ls -la packages/database

# Copy service
COPY services/billing-service ./services/billing-service

# Install dependencies
RUN pnpm install

# Set workdir to service
WORKDIR /app/services/billing-service

# Expose port
EXPOSE 3007

CMD ["node", "src/index.js"]
