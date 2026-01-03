const { body, param, query, validationResult } = require('express-validator');

const chatValidators = {
    sendMessage: [
        body('sessionId')
            .notEmpty()
            .withMessage('Session ID is required')
            .isMongoId()
            .withMessage('Invalid session ID format'),

        body('message')
            .notEmpty()
            .withMessage('Message is required')
            .isString()
            .withMessage('Message must be a string')
            .trim()
            .isLength({ min: 1, max: 10000 })
            .withMessage('Message must be between 1 and 10000 characters'),

        body('model')
            .optional()
            .isString()
            .withMessage('Model must be a string')
            .isIn(['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'])
            .withMessage('Invalid model'),

        body('stream')
            .optional()
            .isBoolean()
            .withMessage('Stream must be a boolean')
    ],

    regenerateResponse: [
        body('sessionId')
            .notEmpty()
            .withMessage('Session ID is required')
            .isMongoId()
            .withMessage('Invalid session ID format'),

        body('messageId')
            .notEmpty()
            .withMessage('Message ID is required')
            .isMongoId()
            .withMessage('Invalid message ID format'),

        body('model')
            .optional()
            .isString()
            .withMessage('Model must be a string')
    ]
};

function validate(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    next();
}

module.exports = {
    ...chatValidators,
    validate
};
