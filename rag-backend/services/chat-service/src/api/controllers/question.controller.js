const questionGenerator = require('../../core/services/question-generator.service');
const questionRepository = require('../../core/repositories/question.repository');
const sessionService = require('../../core/services/session.service');
const { logger } = require('@rag-platform/logger');

/**
 * Question Controller
 * Handles HTTP requests for question generation
 */
class QuestionController {
    /**
     * POST /api/questions/generate
     * Generate questions based on context
     */
    async generateQuestions(req, res, next) {
        try {
            const { sessionId, context, questionCount, categories } = req.body;
            const userId = req.user?.id;
            const tenantId = req.tenant?.id;

            // Validate session ownership
            await sessionService.validateSessionOwnership(sessionId, userId);

            logger.info('Generating questions', {
                sessionId,
                userId,
                questionCount: questionCount || 5
            });

            // Generate questions
            const questions = await questionGenerator.generateQuestions({
                sessionId,
                userId,
                tenantId,
                context,
                questionCount: questionCount || 5,
                categories: categories || []
            });

            res.json({
                success: true,
                data: {
                    questions,
                    count: questions.length
                }
            });

        } catch (error) {
            logger.error('Error in generateQuestions controller:', error);
            next(error);
        }
    }

    /**
     * GET /api/questions/history/:sessionId
     * Get question history for a session
     */
    async getQuestionHistory(req, res, next) {
        try {
            const { sessionId } = req.params;
            const { category, answered } = req.query;
            const userId = req.user?.id;

            // Validate session ownership
            await sessionService.validateSessionOwnership(sessionId, userId);

            const options = {};
            if (category) options.category = category;
            if (answered !== undefined) options.answered = answered === 'true';

            const questions = await questionRepository.findBySession(sessionId, options);

            res.json({
                success: true,
                data: {
                    questions,
                    count: questions.length
                }
            });

        } catch (error) {
            logger.error('Error in getQuestionHistory controller:', error);
            next(error);
        }
    }

    /**
     * GET /api/questions/:questionId
     * Get specific question details
     */
    async getQuestion(req, res, next) {
        try {
            const { questionId } = req.params;
            const tenantId = req.tenant?.id;

            const question = await questionRepository.findById(questionId, tenantId);

            if (!question) {
                return res.status(404).json({
                    success: false,
                    error: 'Question not found'
                });
            }

            res.json({
                success: true,
                data: question
            });

        } catch (error) {
            logger.error('Error in getQuestion controller:', error);
            next(error);
        }
    }

    /**
     * POST /api/questions/:questionId/feedback
     * Submit feedback on a question
     */
    async submitFeedback(req, res, next) {
        try {
            const { questionId } = req.params;
            const { helpful, rating, comment, actionTaken } = req.body;
            const userId = req.user?.id;
            const tenantId = req.tenant?.id;

            // Update question feedback
            const question = await questionRepository.updateFeedback(questionId, tenantId, {
                helpful,
                rating,
                comment
            });

            // Create feedback record
            await questionRepository.createFeedback({
                questionId,
                userId,
                helpful,
                rating: rating || 3,
                comment: comment || '',
                actionTaken: actionTaken || 'none'
            });

            logger.info('Question feedback submitted', { questionId, userId });

            res.json({
                success: true,
                data: question
            });

        } catch (error) {
            logger.error('Error in submitFeedback controller:', error);
            next(error);
        }
    }

    /**
     * POST /api/questions/follow-up
     * Generate follow-up questions
     */
    async generateFollowUp(req, res, next) {
        try {
            const { sessionId, previousQuestionId, conversationHistory } = req.body;
            const userId = req.user?.id;
            const tenantId = req.tenant?.id;

            // Validate session ownership
            await sessionService.validateSessionOwnership(sessionId, userId);

            logger.info('Generating follow-up questions', {
                sessionId,
                previousQuestionId
            });

            const questions = await questionGenerator.generateFollowUpQuestions({
                sessionId,
                userId,
                tenantId,
                previousQuestionId,
                conversationHistory: conversationHistory || []
            });

            res.json({
                success: true,
                data: {
                    questions,
                    count: questions.length
                }
            });

        } catch (error) {
            logger.error('Error in generateFollowUp controller:', error);
            next(error);
        }
    }

    /**
     * GET /api/questions/popular
     * Get popular questions
     */
    async getPopularQuestions(req, res, next) {
        try {
            const { category, limit } = req.query;
            const tenantId = req.tenant?.id;

            const filters = { tenantId };
            if (category) filters.category = category;
            if (limit) filters.limit = parseInt(limit, 10);

            const questions = await questionRepository.getPopularQuestions(filters);

            res.json({
                success: true,
                data: {
                    questions,
                    count: questions.length
                }
            });

        } catch (error) {
            logger.error('Error in getPopularQuestions controller:', error);
            next(error);
        }
    }

    /**
     * GET /api/questions/statistics
     * Get question statistics
     */
    async getStatistics(req, res, next) {
        try {
            const { startDate } = req.query;
            const userId = req.user?.id;

            const filters = { userId };
            if (startDate) filters.startDate = startDate;

            const statistics = await questionRepository.getFeedbackStatistics(filters);

            res.json({
                success: true,
                data: statistics
            });

        } catch (error) {
            logger.error('Error in getStatistics controller:', error);
            next(error);
        }
    }

    /**
     * DELETE /api/questions/:questionId
     * Delete a question
     */
    async deleteQuestion(req, res, next) {
        try {
            const { questionId } = req.params;
            const tenantId = req.tenant?.id;

            await questionRepository.delete(questionId, tenantId);

            res.json({
                success: true,
                message: 'Question deleted successfully'
            });

        } catch (error) {
            logger.error('Error in deleteQuestion controller:', error);
            next(error);
        }
    }
}

module.exports = new QuestionController();
