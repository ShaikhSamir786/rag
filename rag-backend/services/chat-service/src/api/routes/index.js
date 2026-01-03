const express = require('express');
const router = express.Router();

// Import route modules
const chatRoutes = require('./chat.routes');
const sessionRoutes = require('./session.routes');
const messageRoutes = require('./message.routes');

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'chat-service',
        status: 'healthy',
        timestamp: new Date()
    });
});

// Mount routes
router.use('/api', chatRoutes);
router.use('/api', sessionRoutes);
router.use('/api', messageRoutes);

module.exports = router;
