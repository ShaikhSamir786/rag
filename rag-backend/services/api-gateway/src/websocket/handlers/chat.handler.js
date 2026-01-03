const { logger } = require('@rag-platform/logger');

const handleChat = (io, socket) => {
    socket.on('chat:message', (msg) => {
        logger.info(`Chat message from ${socket.id}: ${msg}`);
        // Here you would typically forward to Chat Service or broadcast
        // For gateway pattern, we might want to proxy this or just handle simple routing
        io.to('chat').emit('chat:broadcast', msg);
    });

    socket.on('join', (room) => {
        socket.join(room);
        logger.info(`${socket.id} joined ${room}`);
    });
};

const handleNotification = (io, socket) => {
    // Notification logic
};

module.exports = { handleChat, handleNotification };
