const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { param, body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

// Get messages for a session
router.get(
    '/sessions/:sessionId/messages',
    [param('sessionId').isMongoId().withMessage('Invalid session ID')],
    validate,
    messageController.getMessages
);

// Get single message
router.get(
    '/messages/:messageId',
    [param('messageId').isMongoId().withMessage('Invalid message ID')],
    validate,
    messageController.getMessage
);

// Add feedback to message
router.post(
    '/messages/:messageId/feedback',
    [
        param('messageId').isMongoId().withMessage('Invalid message ID'),
        body('rating').isIn(['positive', 'negative']).withMessage('Rating must be positive or negative'),
        body('comment').optional().isString().withMessage('Comment must be a string')
    ],
    validate,
    messageController.addFeedback
);

// Delete message
router.delete(
    '/messages/:messageId',
    [param('messageId').isMongoId().withMessage('Invalid message ID')],
    validate,
    messageController.deleteMessage
);

// Get conversation history
router.get(
    '/sessions/:sessionId/history',
    [param('sessionId').isMongoId().withMessage('Invalid session ID')],
    validate,
    messageController.getHistory
);

// Export conversation history
router.get(
    '/sessions/:sessionId/history/export',
    [param('sessionId').isMongoId().withMessage('Invalid session ID')],
    validate,
    messageController.exportHistory
);

// Clear conversation history
router.delete(
    '/sessions/:sessionId/history',
    [param('sessionId').isMongoId().withMessage('Invalid session ID')],
    validate,
    messageController.clearHistory
);

module.exports = router;
