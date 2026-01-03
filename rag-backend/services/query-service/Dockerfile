FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configs
COPY pnpm-workspace.yaml package.json ./

# Copy packages
COPY packages ./packages

# Copy service
COPY services/query-service ./services/query-service

# Install dependencies
RUN pnpm install --frozen-lockfile

# Set workdir to service
WORKDIR /app/services/query-service

# Expose port
EXPOSE 3004

CMD ["node", "src/index.js"]
