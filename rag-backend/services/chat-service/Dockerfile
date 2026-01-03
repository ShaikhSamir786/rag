FROM node:20-alpine

WORKDIR /app

# Install pnpm (or use npm)
RUN npm install -g npm@latest

# Copy workspace configs
COPY package.json ./

# Copy packages
COPY packages ./packages

# Copy service
COPY services/chat-service ./services/chat-service

# Install dependencies
RUN npm install

# Set workdir
WORKDIR /app/services/chat-service

EXPOSE 3006

CMD ["node", "src/index.js"]
