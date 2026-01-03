module.exports = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        models: {
            'gpt-4': {
                maxTokens: 8192,
                costPer1kInput: 0.03,
                costPer1kOutput: 0.06
            },
            'gpt-3.5-turbo': {
                maxTokens: 4096,
                costPer1kInput: 0.0015,
                costPer1kOutput: 0.002
            }
        },
        defaultModel: 'gpt-4',
        defaultTemperature: 0.7,
        defaultMaxTokens: 2000
    },

    anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
        models: {
            'claude-3-opus': {
                maxTokens: 4096,
                costPer1kInput: 0.015,
                costPer1kOutput: 0.075
            },
            'claude-3-sonnet': {
                maxTokens: 4096,
                costPer1kInput: 0.003,
                costPer1kOutput: 0.015
            }
        },
        defaultModel: 'claude-3-sonnet-20240229',
        defaultTemperature: 0.7,
        defaultMaxTokens: 2000
    },

    // Default settings
    defaults: {
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0
    }
};
