const mongoose = require('mongoose');

const questionFeedbackSchema = new mongoose.Schema({
    questionId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    helpful: {
        type: Boolean,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        default: ''
    },
    actionTaken: {
        type: String,
        enum: ['answered', 'dismissed', 'modified', 'none'],
        default: 'none'
    }
}, {
    timestamps: true,
    collection: 'question_feedback'
});

// Indexes
questionFeedbackSchema.index({ questionId: 1, userId: 1 }, { unique: true });
questionFeedbackSchema.index({ helpful: 1, rating: -1 });

// Static method to get average rating for a question
questionFeedbackSchema.statics.getAverageRating = async function (questionId) {
    const result = await this.aggregate([
        { $match: { questionId } },
        {
            $group: {
                _id: '$questionId',
                averageRating: { $avg: '$rating' },
                totalFeedback: { $sum: 1 },
                helpfulCount: {
                    $sum: { $cond: ['$helpful', 1, 0] }
                }
            }
        }
    ]);

    return result[0] || { averageRating: 0, totalFeedback: 0, helpfulCount: 0 };
};

// Static method to get feedback statistics
questionFeedbackSchema.statics.getStatistics = async function (filters = {}) {
    const match = {};

    if (filters.userId) {
        match.userId = filters.userId;
    }

    if (filters.startDate) {
        match.createdAt = { $gte: new Date(filters.startDate) };
    }

    const result = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalFeedback: { $sum: 1 },
                averageRating: { $avg: '$rating' },
                helpfulCount: {
                    $sum: { $cond: ['$helpful', 1, 0] }
                },
                actionCounts: {
                    $push: '$actionTaken'
                }
            }
        }
    ]);

    return result[0] || {
        totalFeedback: 0,
        averageRating: 0,
        helpfulCount: 0,
        actionCounts: []
    };
};

const QuestionFeedback = mongoose.model('QuestionFeedback', questionFeedbackSchema);

module.exports = QuestionFeedback;
