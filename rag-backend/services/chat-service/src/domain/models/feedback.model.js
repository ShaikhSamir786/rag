const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        required: true,
        index: true
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    rating: {
        type: String,
        enum: ['positive', 'negative'],
        required: true
    },
    comment: String,
    tags: [String],
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes
feedbackSchema.index({ messageId: 1 });
feedbackSchema.index({ sessionId: 1 });
feedbackSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
