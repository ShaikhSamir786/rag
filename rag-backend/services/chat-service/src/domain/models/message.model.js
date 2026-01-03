const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    metadata: {
        tokens: Number,
        model: String,
        finishReason: String,
        citations: [{
            source: String,
            content: String,
            score: Number
        }]
    },
    feedback: {
        rating: {
            type: String,
            enum: ['positive', 'negative', null],
            default: null
        },
        comment: String,
        createdAt: Date
    }
}, {
    timestamps: true
});

// Indexes
messageSchema.index({ sessionId: 1, createdAt: 1 });
messageSchema.index({ sessionId: 1, role: 1 });

module.exports = mongoose.model('Message', messageSchema);
