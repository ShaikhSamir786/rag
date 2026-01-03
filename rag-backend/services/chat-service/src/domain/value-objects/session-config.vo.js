class SessionConfig {
    constructor({ model = 'gpt-4', temperature = 0.7, maxTokens = 2000, topP = 1, frequencyPenalty = 0, presencePenalty = 0 } = {}) {
        this.validateConfig({ model, temperature, maxTokens, topP, frequencyPenalty, presencePenalty });

        this.model = model;
        this.temperature = temperature;
        this.maxTokens = maxTokens;
        this.topP = topP;
        this.frequencyPenalty = frequencyPenalty;
        this.presencePenalty = presencePenalty;
    }

    validateConfig({ temperature, maxTokens, topP, frequencyPenalty, presencePenalty }) {
        if (temperature < 0 || temperature > 2) {
            throw new Error('Temperature must be between 0 and 2');
        }
        if (maxTokens < 1) {
            throw new Error('Max tokens must be at least 1');
        }
        if (topP < 0 || topP > 1) {
            throw new Error('Top P must be between 0 and 1');
        }
        if (frequencyPenalty < -2 || frequencyPenalty > 2) {
            throw new Error('Frequency penalty must be between -2 and 2');
        }
        if (presencePenalty < -2 || presencePenalty > 2) {
            throw new Error('Presence penalty must be between -2 and 2');
        }
    }

    toJSON() {
        return {
            model: this.model,
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            topP: this.topP,
            frequencyPenalty: this.frequencyPenalty,
            presencePenalty: this.presencePenalty
        };
    }
}

module.exports = SessionConfig;
