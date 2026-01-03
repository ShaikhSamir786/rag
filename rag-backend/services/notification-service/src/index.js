const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { logger } = require('@rag-platform/logger');
const { setupWorker } = require('./workers/processors/email-processor');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());

const PORT = process.env.PORT || 3007;

io.on('connection', (socket) => {
    logger.info(`Notification Client connected: ${socket.id}`);
    socket.on('disconnect', () => logger.info('Notification Client disconnected'));
});

// Expose io to worker or API if needed via app.set or similar, or just global
global.io = io;

const start = async () => {
    setupWorker();
    server.listen(PORT, () => {
        logger.info(`Notification Service (WS+REST) running on port ${PORT}`);
    });
};

start();
