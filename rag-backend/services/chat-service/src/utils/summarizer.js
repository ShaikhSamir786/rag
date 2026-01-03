const llmFactory = require('../infrastructure/llm/llm-factory');
const { logger } = require('@rag-platform/logger');

class Summarizer {
    async summarizeConversation(messages, model = 'gpt-3.5-turbo') {
        try {
            if (!messages || messages.length === 0) {
                return 'Empty conversation';
            }

            const conversationText = messages
                .map(msg => `${msg.role}: ${msg.content}`)
                .join('\n');

            const prompt = [
                {
                    role: 'system',
                    content: 'Summarize the following conversation in 2-3 sentences. Focus on the main topics and key points discussed.'
                },
                {
                    role: 'user',
                    content: conversationText
                }
            ];

            const response = await llmFactory.createChatCompletion({
                messages: prompt,
                model,
                temperature: 0.3,
                maxTokens: 150
            });

            return response.choices[0].message.content.trim();
        } catch (error) {
            logger.error('Error summarizing conversation:', error);
            return 'Unable to generate summary';
        }
    }

    async generateTitle(messages, model = 'gpt-3.5-turbo') {
        try {
            if (!messages || messages.length === 0) {
                return 'New Chat';
            }

            // Get first few messages
            const firstMessages = messages.slice(0, 3);
            const conversationText = firstMessages
                .map(msg => `${msg.role}: ${msg.content}`)
                .join('\n');

            const prompt = [
                {
                    role: 'system',
                    content: 'Generate a short, descriptive title (3-5 words) for this conversation. Return only the title, nothing else.'
                },
                {
                    role: 'user',
                    content: conversationText
                }
            ];

            const response = await llmFactory.createChatCompletion({
                messages: prompt,
                model,
                temperature: 0.3,
                maxTokens: 20
            });

            const title = response.choices[0].message.content.trim();

            // Remove quotes if present
            return title.replace(/^["']|["']$/g, '');
        } catch (error) {
            logger.error('Error generating title:', error);
            return 'New Chat';
        }
    }

    async summarizeLongMessage(content, maxLength = 500) {
        try {
            if (content.length <= maxLength) {
                return content;
            }

            const prompt = [
                {
                    role: 'system',
                    content: `Summarize the following text to approximately ${maxLength} characters while preserving key information.`
                },
                {
                    role: 'user',
                    content
                }
            ];

            const response = await llmFactory.createChatCompletion({
                messages: prompt,
                model: 'gpt-3.5-turbo',
                temperature: 0.3,
                maxTokens: Math.ceil(maxLength / 4)
            });

            return response.choices[0].message.content.trim();
        } catch (error) {
            logger.error('Error summarizing message:', error);
            return content.substring(0, maxLength) + '...';
        }
    }
}

module.exports = new Summarizer();
