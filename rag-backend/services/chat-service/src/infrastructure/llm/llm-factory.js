const OpenAIClient = require('./openai.client');
const AnthropicClient = require('./anthropic.client');
const { logger } = require('@rag-platform/logger');

class LLMFactory {
    constructor() {
        this.clients = new Map();
        this.initializeClients();
    }

    initializeClients() {
        // Initialize OpenAI client
        if (process.env.OPENAI_API_KEY) {
            this.clients.set('openai', new OpenAIClient());
            this.clients.set('gpt-4', new OpenAIClient());
            this.clients.set('gpt-3.5-turbo', new OpenAIClient());
        }

        // Initialize Anthropic client
        if (process.env.ANTHROPIC_API_KEY) {
            this.clients.set('anthropic', new AnthropicClient());
            this.clients.set('claude-3-opus', new AnthropicClient());
            this.clients.set('claude-3-sonnet', new AnthropicClient());
        }
    }

    getClient(model) {
        // Determine provider from model name
        if (model.startsWith('gpt-')) {
            return this.clients.get('openai');
        } else if (model.startsWith('claude-')) {
            return this.clients.get('anthropic');
        }

        // Default to OpenAI
        logger.warn(`Unknown model: ${model}, defaulting to OpenAI`);
        return this.clients.get('openai');
    }

    async createChatCompletion({ messages, model = 'gpt-4', temperature = 0.7, maxTokens = 2000, stream = false }) {
        const client = this.getClient(model);

        if (!client) {
            throw new Error(`No client available for model: ${model}`);
        }

        return client.createChatCompletion({ messages, model, temperature, maxTokens, stream });
    }

    async createStreamingCompletion({ messages, model = 'gpt-4', temperature = 0.7, maxTokens = 2000 }) {
        const client = this.getClient(model);

        if (!client) {
            throw new Error(`No client available for model: ${model}`);
        }

        return client.createStreamingCompletion({ messages, model, temperature, maxTokens });
    }

    async countTokens(text, model = 'gpt-4') {
        const client = this.getClient(model);

        if (!client) {
            throw new Error(`No client available for model: ${model}`);
        }

        return client.countTokens(text);
    }
}

module.exports = new LLMFactory();
