const axios = require('axios');
const { logger } = require('@rag-platform/logger');

class AnthropicClient {
    constructor() {
        this.apiKey = process.env.ANTHROPIC_API_KEY;
        this.baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1';
        this.defaultModel = 'claude-3-sonnet-20240229';
    }

    async createChatCompletion({ messages, model = this.defaultModel, temperature = 0.7, maxTokens = 2000, stream = false }) {
        try {
            // Convert OpenAI format to Anthropic format
            const systemMessage = messages.find(m => m.role === 'system');
            const conversationMessages = messages.filter(m => m.role !== 'system');

            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    model,
                    messages: conversationMessages,
                    system: systemMessage?.content,
                    temperature,
                    max_tokens: maxTokens,
                    stream
                },
                {
                    headers: {
                        'x-api-key': this.apiKey,
                        'anthropic-version': '2023-06-01',
                        'Content-Type': 'application/json'
                    },
                    responseType: stream ? 'stream' : 'json'
                }
            );

            // Convert Anthropic response to OpenAI format
            if (!stream) {
                return {
                    choices: [{
                        message: {
                            role: 'assistant',
                            content: response.data.content[0].text
                        },
                        finish_reason: response.data.stop_reason
                    }],
                    usage: {
                        prompt_tokens: response.data.usage.input_tokens,
                        completion_tokens: response.data.usage.output_tokens,
                        total_tokens: response.data.usage.input_tokens + response.data.usage.output_tokens
                    }
                };
            }

            return response.data;
        } catch (error) {
            logger.error('Anthropic API error:', error.response?.data || error.message);
            throw new Error(`Anthropic API error: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    async createStreamingCompletion({ messages, model = this.defaultModel, temperature = 0.7, maxTokens = 2000 }) {
        return this.createChatCompletion({ messages, model, temperature, maxTokens, stream: true });
    }

    async countTokens(text) {
        // Simple approximation: 1 token ≈ 4 characters
        return Math.ceil(text.length / 4);
    }
}

module.exports = AnthropicClient;
