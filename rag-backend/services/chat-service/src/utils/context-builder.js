const tokenCounter = require('./token-counter');
const { logger } = require('@rag-platform/logger');

class ContextBuilder {
    buildSystemPrompt(ragContext = null, customPrompt = null) {
        if (customPrompt) {
            return customPrompt;
        }

        if (ragContext) {
            return `You are a helpful AI assistant. Use the following context to answer the user's questions accurately and comprehensively.

Context:
${ragContext}

Instructions:
- Answer based on the provided context when relevant
- If the context doesn't contain the answer, use your general knowledge
- Be concise but thorough
- Cite sources when using information from the context`;
        }

        return 'You are a helpful AI assistant. Provide accurate, helpful, and concise responses.';
    }

    buildConversationContext(messages, maxTokens = 2000) {
        if (!Array.isArray(messages) || messages.length === 0) {
            return [];
        }

        const context = [];
        let totalTokens = 0;

        // Add messages in reverse order (most recent first)
        for (let i = messages.length - 1; i >= 0; i--) {
            const message = messages[i];
            const messageTokens = tokenCounter.countTokens(message.content);

            if (totalTokens + messageTokens > maxTokens) {
                logger.info(`Context truncated at ${context.length} messages (${totalTokens} tokens)`);
                break;
            }

            context.unshift({
                role: message.role,
                content: message.content
            });

            totalTokens += messageTokens;
        }

        return context;
    }

    buildRAGContext(citations, maxLength = 2000) {
        if (!Array.isArray(citations) || citations.length === 0) {
            return '';
        }

        let context = '';

        for (const citation of citations) {
            const citationText = `[${citation.index}] ${citation.content}\nSource: ${citation.source}\n\n`;

            if (context.length + citationText.length > maxLength) {
                break;
            }

            context += citationText;
        }

        return context.trim();
    }

    buildFullContext({ systemPrompt, ragContext, conversationHistory, currentMessage }) {
        const messages = [];

        // Add system prompt
        const finalSystemPrompt = this.buildSystemPrompt(ragContext, systemPrompt);
        messages.push({
            role: 'system',
            content: finalSystemPrompt
        });

        // Add conversation history
        if (conversationHistory && conversationHistory.length > 0) {
            const contextMessages = this.buildConversationContext(conversationHistory);
            messages.push(...contextMessages);
        }

        // Add current message
        if (currentMessage) {
            messages.push({
                role: 'user',
                content: currentMessage
            });
        }

        return messages;
    }

    estimateContextSize(messages) {
        return tokenCounter.countMessagesTokens(messages);
    }
}

module.exports = new ContextBuilder();
