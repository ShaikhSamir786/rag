const mongoose = require('mongoose');

const sessionMetadataSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true,
        unique: true
    },
    settings: {
        model: {
            type: String,
            default: 'gpt-4'
        },
        temperature: {
            type: Number,
            default: 0.7,
            min: 0,
            max: 2
        },
        maxTokens: {
            type: Number,
            default: 2000
        },
        topP: {
            type: Number,
            default: 1
        },
        frequencyPenalty: {
            type: Number,
            default: 0
        },
        presencePenalty: {
            type: Number,
            default: 0
        }
    },
    systemPrompt: String,
    ragEnabled: {
        type: Boolean,
        default: true
    },
    ragSettings: {
        topK: {
            type: Number,
            default: 5
        },
        similarityThreshold: {
            type: Number,
            default: 0.7
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SessionMetadata', sessionMetadataSchema);
