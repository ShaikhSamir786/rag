const Joi = require('joi');
const { logger } = require('@rag-platform/logger');

/**
 * Question Validator
 * Validates question generation requests
 */
class QuestionValidator {
    /**
     * Validate question generation request
     */
    validateGenerateRequest(req, res, next) {
        const schema = Joi.object({
            sessionId: Joi.string().required(),
            context: Joi.object({
                currentFile: Joi.string().allow(''),
                cursorPosition: Joi.object({
                    line: Joi.number().integer().min(0),
                    column: Joi.number().integer().min(0)
                }),
                selectedCode: Joi.string().allow(''),
                openFiles: Joi.array().items(Joi.string()),
                recentChanges: Joi.array().items(Joi.object())
            }).required(),
            questionCount: Joi.number().integer().min(1).max(10).default(5),
            categories: Joi.array().items(
                Joi.string().valid('clarification', 'technical', 'architectural', 'best-practice', 'debugging')
            )
        });

        const { error, value } = schema.validate(req.body);

        if (error) {
            logger.warn('Validation error in generateQuestions:', error.details);
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }

        req.body = value;
        next();
    }

    /**
     * Validate feedback request
     */
    validateFeedbackRequest(req, res, next) {
        const schema = Joi.object({
            helpful: Joi.boolean().required(),
            rating: Joi.number().integer().min(1).max(5).required(),
            comment: Joi.string().allow('').max(500),
            actionTaken: Joi.string().valid('answered', 'dismissed', 'modified', 'none').default('none')
        });

        const { error, value } = schema.validate(req.body);

        if (error) {
            logger.warn('Validation error in submitFeedback:', error.details);
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }

        req.body = value;
        next();
    }

    /**
     * Validate follow-up request
     */
    validateFollowUpRequest(req, res, next) {
        const schema = Joi.object({
            sessionId: Joi.string().required(),
            previousQuestionId: Joi.string().required(),
            conversationHistory: Joi.array().items(
                Joi.object({
                    role: Joi.string().valid('user', 'assistant').required(),
                    content: Joi.string().required()
                })
            )
        });

        const { error, value } = schema.validate(req.body);

        if (error) {
            logger.warn('Validation error in generateFollowUp:', error.details);
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }

        req.body = value;
        next();
    }

    /**
     * Validate question ID parameter
     */
    validateQuestionId(req, res, next) {
        const { questionId } = req.params;

        if (!questionId || questionId.length !== 24) {
            return res.status(400).json({
                success: false,
                error: 'Invalid question ID'
            });
        }

        next();
    }

    /**
     * Validate session ID parameter
     */
    validateSessionId(req, res, next) {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
        }

        next();
    }
}

module.exports = new QuestionValidator();
