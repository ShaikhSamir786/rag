const mongoose = require('mongoose');

const generatedQuestionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    tenantId: {
        type: String,
        required: true,
        index: true
    },
    question: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['clarification', 'technical', 'architectural', 'best-practice', 'debugging'],
        default: 'technical',
        index: true
    },
    context: {
        file: {
            type: String,
            default: ''
        },
        lineNumber: {
            type: Number,
            default: 0
        },
        codeSnippet: {
            type: String,
            default: ''
        },
        relatedFiles: [{
            type: String
        }],
        detectedPatterns: [{
            type: String
        }]
    },
    relevanceScore: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
    },
    metadata: {
        model: {
            type: String,
            default: 'gpt-4'
        },
        tokens: {
            type: Number,
            default: 0
        },
        generationTime: {
            type: Number,
            default: 0
        },
        templateUsed: {
            type: String,
            default: ''
        },
        reasoning: {
            type: String,
            default: ''
        },
        priority: {
            type: String,
            enum: ['high', 'medium', 'low'],
            default: 'medium'
        },
        parentQuestionId: {
            type: String,
            default: null
        }
    },
    feedback: {
        helpful: {
            type: Boolean,
            default: null
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },
        comment: {
            type: String,
            default: ''
        }
    },
    answered: {
        type: Boolean,
        default: false,
        index: true
    },
    answerId: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    collection: 'generated_questions'
});

// Indexes for performance
generatedQuestionSchema.index({ sessionId: 1, createdAt: -1 });
generatedQuestionSchema.index({ userId: 1, tenantId: 1 });
generatedQuestionSchema.index({ category: 1, relevanceScore: -1 });
generatedQuestionSchema.index({ answered: 1, createdAt: -1 });

// Virtual for formatted question
generatedQuestionSchema.virtual('formattedQuestion').get(function () {
    let formatted = this.question;
    if (this.metadata.reasoning) {
        formatted += `\n\nReasoning: ${this.metadata.reasoning}`;
    }
    return formatted;
});

// Method to mark as answered
generatedQuestionSchema.methods.markAsAnswered = function (answerId) {
    this.answered = true;
    this.answerId = answerId;
    return this.save();
};

// Method to add feedback
generatedQuestionSchema.methods.addFeedback = function (feedback) {
    this.feedback = {
        ...this.feedback,
        ...feedback
    };
    return this.save();
};

// Static method to find by session
generatedQuestionSchema.statics.findBySession = function (sessionId, options = {}) {
    const query = this.find({ sessionId });

    if (options.answered !== undefined) {
        query.where('answered').equals(options.answered);
    }

    if (options.category) {
        query.where('category').equals(options.category);
    }

    return query.sort({ relevanceScore: -1, createdAt: -1 }).exec();
};

// Static method to find popular questions
generatedQuestionSchema.statics.findPopular = function (filters = {}) {
    const query = this.find();

    if (filters.tenantId) {
        query.where('tenantId').equals(filters.tenantId);
    }

    if (filters.category) {
        query.where('category').equals(filters.category);
    }

    return query
        .where('feedback.helpful').equals(true)
        .sort({ 'feedback.rating': -1, relevanceScore: -1 })
        .limit(filters.limit || 10)
        .exec();
};

// Static method to cleanup old questions
generatedQuestionSchema.statics.cleanupOld = function (olderThanDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return this.deleteMany({
        createdAt: { $lt: cutoffDate },
        answered: false
    }).exec();
};

const GeneratedQuestion = mongoose.model('GeneratedQuestion', generatedQuestionSchema);

module.exports = GeneratedQuestion;
