const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { sendMessage, regenerateResponse, validate } = require('../validators/chat.validator');
const validateSessionOwnership = require('../middlewares/session-validation.middleware');
const messageLimitMiddleware = require('../middlewares/message-limit.middleware');

// Send message
router.post(
    '/chat',
    sendMessage,
    validate,
    validateSessionOwnership,
    messageLimitMiddleware,
    chatController.sendMessage
);

// Stream message
router.post(
    '/chat/stream',
    sendMessage,
    validate,
    validateSessionOwnership,
    messageLimitMiddleware,
    chatController.streamMessage
);

// Regenerate response
router.post(
    '/chat/regenerate',
    regenerateResponse,
    validate,
    validateSessionOwnership,
    chatController.regenerateResponse
);

module.exports = router;
