const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        default: 'New Chat'
    },
    metadata: {
        model: {
            type: String,
            default: 'gpt-4'
        },
        temperature: {
            type: Number,
            default: 0.7
        },
        maxTokens: {
            type: Number,
            default: 2000
        },
        systemPrompt: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Session', sessionSchema);
