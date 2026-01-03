const messageRepository = require('../repositories/message.repository');
const queryServiceClient = require('../../infrastructure/retrieval/query-service.client');
const { logger } = require('@rag-platform/logger');

class ContextService {
    async buildContext(sessionId, currentQuery, options = {}) {
        try {
            const {
                includeHistory = true,
                historyLimit = 10,
                includeRAG = true,
                ragTopK = 5,
                ragThreshold = 0.7
            } = options;

            const context = {
                history: [],
                ragContext: '',
                citations: []
            };

            // Get conversation history
            if (includeHistory) {
                const messages = await messageRepository.findConversationHistory(sessionId, historyLimit);
                context.history = messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));
            }

            // Get RAG context
            if (includeRAG) {
                try {
                    const ragResult = await queryServiceClient.getContext({
                        query: currentQuery,
                        topK: ragTopK,
                        threshold: ragThreshold
                    });

                    context.ragContext = ragResult.context;
                    context.citations = ragResult.citations;
                } catch (error) {
                    logger.warn('Failed to get RAG context, continuing without it:', error.message);
                }
            }

            return context;
        } catch (error) {
            logger.error('Error building context:', error);
            throw error;
        }
    }

    async buildPrompt(sessionId, userMessage, systemPrompt = null) {
        try {
            const context = await this.buildContext(sessionId, userMessage);

            const messages = [];

            // Add system prompt
            if (systemPrompt) {
                messages.push({
                    role: 'system',
                    content: systemPrompt
                });
            } else if (context.ragContext) {
                messages.push({
                    role: 'system',
                    content: `You are a helpful assistant. Use the following context to answer the user's question:\n\n${context.ragContext}\n\nIf the context doesn't contain relevant information, use your general knowledge.`
                });
            }

            // Add conversation history
            messages.push(...context.history);

            // Add current user message
            messages.push({
                role: 'user',
                content: userMessage
            });

            return {
                messages,
                citations: context.citations
            };
        } catch (error) {
            logger.error('Error building prompt:', error);
            throw error;
        }
    }

    formatCitations(citations) {
        if (!citations || citations.length === 0) {
            return '';
        }

        return '\n\nSources:\n' + citations.map((citation, index) =>
            `[${index + 1}] ${citation.source}`
        ).join('\n');
    }
}

module.exports = new ContextService();
