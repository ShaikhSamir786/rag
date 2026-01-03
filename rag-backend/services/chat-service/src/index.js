const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { logger } = require('@rag-platform/logger');
const { errorHandler } = require('@rag-platform/common');

const { connectMongoDB } = require('./config/database');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectMongoDB();
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(express.json());

// Basic health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'chat-service' }));

// WebSocket Logic
io.on('connection', (socket) => {
    logger.info(`User connected to Chat: ${socket.id}`);

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        logger.info(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('send_message', (data) => {
        // Broadcast to room
        io.to(data.roomId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.id}`);
    });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3006;

server.listen(PORT, () => {
    logger.info(`Chat Service running on port ${PORT}`);
});
