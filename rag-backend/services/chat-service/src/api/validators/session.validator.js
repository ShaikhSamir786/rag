const { body, param, query, validationResult } = require('express-validator');

const sessionValidators = {
    createSession: [
        body('title')
            .optional()
            .isString()
            .withMessage('Title must be a string')
            .trim()
            .isLength({ max: 200 })
            .withMessage('Title must be less than 200 characters'),

        body('metadata')
            .optional()
            .isObject()
            .withMessage('Metadata must be an object'),

        body('metadata.model')
            .optional()
            .isString()
            .withMessage('Model must be a string'),

        body('metadata.temperature')
            .optional()
            .isFloat({ min: 0, max: 2 })
            .withMessage('Temperature must be between 0 and 2'),

        body('metadata.maxTokens')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Max tokens must be a positive integer')
    ],

    updateSession: [
        param('sessionId')
            .notEmpty()
            .withMessage('Session ID is required')
            .isMongoId()
            .withMessage('Invalid session ID format'),

        body('title')
            .optional()
            .isString()
            .withMessage('Title must be a string')
            .trim()
            .isLength({ max: 200 })
            .withMessage('Title must be less than 200 characters'),

        body('metadata')
            .optional()
            .isObject()
            .withMessage('Metadata must be an object')
    ],

    getSession: [
        param('sessionId')
            .notEmpty()
            .withMessage('Session ID is required')
            .isMongoId()
            .withMessage('Invalid session ID format')
    ],

    deleteSession: [
        param('sessionId')
            .notEmpty()
            .withMessage('Session ID is required')
            .isMongoId()
            .withMessage('Invalid session ID format')
    ],

    getUserSessions: [
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),

        query('skip')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Skip must be a non-negative integer'),

        query('includeInactive')
            .optional()
            .isBoolean()
            .withMessage('IncludeInactive must be a boolean')
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
    ...sessionValidators,
    validate
};
