const express = require('express');
const router = express.Router();
const questionController = require('../controllers/question.controller');
const questionValidator = require('../validators/question.validator');
// const { authMiddleware } = require('@rag-platform/common'); // Uncomment when auth is ready

/**
 * Question Routes
 * API endpoints for question generation
 */

// Generate questions based on context
router.post(
    '/questions/generate',
    // authMiddleware, // Uncomment when auth is ready
    questionValidator.validateGenerateRequest,
    questionController.generateQuestions
);

// Get question history for a session
router.get(
    '/questions/history/:sessionId',
    // authMiddleware, // Uncomment when auth is ready
    questionValidator.validateSessionId,
    questionController.getQuestionHistory
);

// Get specific question details
router.get(
    '/questions/:questionId',
    // authMiddleware, // Uncomment when auth is ready
    questionValidator.validateQuestionId,
    questionController.getQuestion
);

// Submit feedback on a question
router.post(
    '/questions/:questionId/feedback',
    // authMiddleware, // Uncomment when auth is ready
    questionValidator.validateQuestionId,
    questionValidator.validateFeedbackRequest,
    questionController.submitFeedback
);

// Generate follow-up questions
router.post(
    '/questions/follow-up',
    // authMiddleware, // Uncomment when auth is ready
    questionValidator.validateFollowUpRequest,
    questionController.generateFollowUp
);

// Get popular questions
router.get(
    '/questions/popular',
    // authMiddleware, // Uncomment when auth is ready
    questionController.getPopularQuestions
);

// Get question statistics
router.get(
    '/questions/statistics',
    // authMiddleware, // Uncomment when auth is ready
    questionController.getStatistics
);

// Delete a question
router.delete(
    '/questions/:questionId',
    // authMiddleware, // Uncomment when auth is ready
    questionValidator.validateQuestionId,
    questionController.deleteQuestion
);

module.exports = router;
