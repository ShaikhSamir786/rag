const { logger } = require('@rag-platform/logger');

class TokenCounter {
    /**
     * Estimate token count for text
     * Note: This is a simple approximation. For production, use tiktoken library
     */
    countTokens(text) {
        if (!text || typeof text !== 'string') {
            return 0;
        }

        // Simple approximation: 1 token ≈ 4 characters
        return Math.ceil(text.length / 4);
    }

    countMessagesTokens(messages) {
        if (!Array.isArray(messages)) {
            return 0;
        }

        let total = 0;

        for (const message of messages) {
            // Count content tokens
            total += this.countTokens(message.content);

            // Add overhead for message formatting (role, etc.)
            total += 4;
        }

        // Add overhead for message array
        total += 3;

        return total;
    }

    estimateCost(tokens, model = 'gpt-4') {
        // Pricing as of 2024 (per 1K tokens)
        const pricing = {
            'gpt-4': { input: 0.03, output: 0.06 },
            'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
            'claude-3-opus': { input: 0.015, output: 0.075 },
            'claude-3-sonnet': { input: 0.003, output: 0.015 }
        };

        const modelPricing = pricing[model] || pricing['gpt-4'];

        // Assume 50/50 split between input and output
        const inputTokens = tokens * 0.5;
        const outputTokens = tokens * 0.5;

        const cost = (inputTokens / 1000 * modelPricing.input) +
            (outputTokens / 1000 * modelPricing.output);

        return cost;
    }

    checkTokenLimit(text, maxTokens = 4096) {
        const tokens = this.countTokens(text);

        if (tokens > maxTokens) {
            logger.warn(`Token limit exceeded: ${tokens} > ${maxTokens}`);
            return false;
        }

        return true;
    }

    truncateToTokenLimit(text, maxTokens = 4096) {
        const tokens = this.countTokens(text);

        if (tokens <= maxTokens) {
            return text;
        }

        // Approximate character limit
        const maxChars = maxTokens * 4;
        return text.substring(0, maxChars) + '...';
    }
}

module.exports = new TokenCounter();
