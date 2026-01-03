const GeneratedQuestion = require('../../domain/models/generated-question.model');
const QuestionFeedback = require('../../domain/models/question-feedback.model');
const { logger } = require('@rag-platform/logger');

/**
 * Question Repository
 * Data access layer for generated questions
 */
class QuestionRepository {
    /**
     * Create a new question
     * @param {Object} questionData - Question data
     * @returns {Promise<Object>} Created question
     */
    async create(questionData) {
        try {
            const question = new GeneratedQuestion(questionData);
            await question.save();

            logger.info('Question created', { questionId: question._id });
            return this._toJSON(question);
        } catch (error) {
            logger.error('Error creating question:', error);
            throw error;
        }
    }

    /**
     * Find question by ID
     * @param {string} questionId - Question ID
     * @param {string} tenantId - Tenant ID
     * @returns {Promise<Object|null>} Question or null
     */
    async findById(questionId, tenantId) {
        try {
            const question = await GeneratedQuestion.findOne({
                _id: questionId,
                tenantId
            });

            return question ? this._toJSON(question) : null;
        } catch (error) {
            logger.error('Error finding question by ID:', error);
            throw error;
        }
    }

    /**
     * Find questions by session
     * @param {string} sessionId - Session ID
     * @param {Object} options - Query options
     * @returns {Promise<Object[]>} Questions
     */
    async findBySession(sessionId, options = {}) {
        try {
            const questions = await GeneratedQuestion.findBySession(sessionId, options);
            return questions.map(q => this._toJSON(q));
        } catch (error) {
            logger.error('Error finding questions by session:', error);
            throw error;
        }
    }

    /**
     * Find questions by user
     * @param {string} userId - User ID
     * @param {string} tenantId - Tenant ID
     * @param {Object} options - Query options
     * @returns {Promise<Object[]>} Questions
     */
    async findByUser(userId, tenantId, options = {}) {
        try {
            const query = GeneratedQuestion.find({ userId, tenantId });

            if (options.category) {
                query.where('category').equals(options.category);
            }

            if (options.answered !== undefined) {
                query.where('answered').equals(options.answered);
            }

            const questions = await query
                .sort({ createdAt: -1 })
                .limit(options.limit || 50)
                .exec();

            return questions.map(q => this._toJSON(q));
        } catch (error) {
            logger.error('Error finding questions by user:', error);
            throw error;
        }
    }

    /**
     * Update question feedback
     * @param {string} questionId - Question ID
     * @param {string} tenantId - Tenant ID
     * @param {Object} feedback - Feedback data
     * @returns {Promise<Object>} Updated question
     */
    async updateFeedback(questionId, tenantId, feedback) {
        try {
            const question = await GeneratedQuestion.findOne({
                _id: questionId,
                tenantId
            });

            if (!question) {
                throw new Error('Question not found');
            }

            await question.addFeedback(feedback);

            logger.info('Question feedback updated', { questionId });
            return this._toJSON(question);
        } catch (error) {
            logger.error('Error updating question feedback:', error);
            throw error;
        }
    }

    /**
     * Mark question as answered
     * @param {string} questionId - Question ID
     * @param {string} tenantId - Tenant ID
     * @param {string} answerId - Answer message ID
     * @returns {Promise<Object>} Updated question
     */
    async markAsAnswered(questionId, tenantId, answerId) {
        try {
            const question = await GeneratedQuestion.findOne({
                _id: questionId,
                tenantId
            });

            if (!question) {
                throw new Error('Question not found');
            }

            await question.markAsAnswered(answerId);

            logger.info('Question marked as answered', { questionId, answerId });
            return this._toJSON(question);
        } catch (error) {
            logger.error('Error marking question as answered:', error);
            throw error;
        }
    }

    /**
     * Get popular questions
     * @param {Object} filters - Filter options
     * @returns {Promise<Object[]>} Popular questions
     */
    async getPopularQuestions(filters = {}) {
        try {
            const questions = await GeneratedQuestion.findPopular(filters);
            return questions.map(q => this._toJSON(q));
        } catch (error) {
            logger.error('Error getting popular questions:', error);
            throw error;
        }
    }

    /**
     * Delete old questions
     * @param {number} olderThanDays - Delete questions older than this many days
     * @returns {Promise<number>} Number of deleted questions
     */
    async deleteOldQuestions(olderThanDays = 30) {
        try {
            const result = await GeneratedQuestion.cleanupOld(olderThanDays);
            logger.info('Old questions deleted', { count: result.deletedCount });
            return result.deletedCount;
        } catch (error) {
            logger.error('Error deleting old questions:', error);
            throw error;
        }
    }

    /**
     * Delete question
     * @param {string} questionId - Question ID
     * @param {string} tenantId - Tenant ID
     * @returns {Promise<boolean>} Success
     */
    async delete(questionId, tenantId) {
        try {
            const result = await GeneratedQuestion.deleteOne({
                _id: questionId,
                tenantId
            });

            logger.info('Question deleted', { questionId });
            return result.deletedCount > 0;
        } catch (error) {
            logger.error('Error deleting question:', error);
            throw error;
        }
    }

    /**
     * Create feedback
     * @param {Object} feedbackData - Feedback data
     * @returns {Promise<Object>} Created feedback
     */
    async createFeedback(feedbackData) {
        try {
            const feedback = new QuestionFeedback(feedbackData);
            await feedback.save();

            logger.info('Question feedback created', { questionId: feedbackData.questionId });
            return feedback.toObject();
        } catch (error) {
            logger.error('Error creating feedback:', error);
            throw error;
        }
    }

    /**
     * Get feedback statistics
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Statistics
     */
    async getFeedbackStatistics(filters = {}) {
        try {
            return await QuestionFeedback.getStatistics(filters);
        } catch (error) {
            logger.error('Error getting feedback statistics:', error);
            throw error;
        }
    }

    /**
     * Convert Mongoose document to plain object
     * @private
     */
    _toJSON(question) {
        const obj = question.toObject();
        obj.id = obj._id.toString();
        delete obj._id;
        delete obj.__v;
        return obj;
    }
}

module.exports = new QuestionRepository();
