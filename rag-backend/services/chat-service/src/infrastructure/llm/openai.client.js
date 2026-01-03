const axios = require('axios');
const { logger } = require('@rag-platform/logger');

class OpenAIClient {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
        this.defaultModel = 'gpt-4';
    }

    async createChatCompletion({ messages, model = this.defaultModel, temperature = 0.7, maxTokens = 2000, stream = false }) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model,
                    messages,
                    temperature,
                    max_tokens: maxTokens,
                    stream
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: stream ? 'stream' : 'json'
                }
            );

            return response.data;
        } catch (error) {
            logger.error('OpenAI API error:', error.response?.data || error.message);
            throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    async createStreamingCompletion({ messages, model = this.defaultModel, temperature = 0.7, maxTokens = 2000 }) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model,
                    messages,
                    temperature,
                    max_tokens: maxTokens,
                    stream: true
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'stream'
                }
            );

            return response.data;
        } catch (error) {
            logger.error('OpenAI streaming error:', error.response?.data || error.message);
            throw new Error(`OpenAI streaming error: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    async countTokens(text) {
        // Simple approximation: 1 token ≈ 4 characters
        // For production, use tiktoken library
        return Math.ceil(text.length / 4);
    }
}

module.exports = OpenAIClient;
