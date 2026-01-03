const messageService = require('./message.service');
const contextService = require('./context.service');
const streamingService = require('./streaming.service');
const llmFactory = require('../../infrastructure/llm/llm-factory');
const chatQueue = require('../../infrastructure/queue/chat-queue');
const { logger } = require('@rag-platform/logger');

class ChatService {
    async sendMessage({ sessionId, userId, content, model = 'gpt-4', stream = false }) {
        try {
            // Create user message
            const userMessage = await messageService.createMessage({
                sessionId,
                role: 'user',
                content
            });

            // Build prompt with context
            const { messages, citations } = await contextService.buildPrompt(sessionId, content);

            if (stream) {
                return await this.handleStreamingResponse({
                    sessionId,
                    messages,
                    citations,
                    model
                });
            } else {
                return await this.handleRegularResponse({
                    sessionId,
                    messages,
                    citations,
                    model
                });
            }
        } catch (error) {
            logger.error('Error sending message:', error);
            throw error;
        }
    }

    async handleRegularResponse({ sessionId, messages, citations, model }) {
        try {
            // Get LLM response
            const response = await llmFactory.createChatCompletion({
                messages,
                model,
                temperature: 0.7,
                maxTokens: 2000
            });

            const assistantContent = response.choices[0].message.content;

            // Create assistant message
            const assistantMessage = await messageService.createMessage({
                sessionId,
                role: 'assistant',
                content: assistantContent,
                metadata: {
                    model,
                    tokens: response.usage?.total_tokens,
                    finishReason: response.choices[0].finish_reason,
                    citations
                }
            });

            // Queue async processing
            await chatQueue.addAnalyticsJob({
                sessionId,
                messageId: assistantMessage.id,
                userId: messages.userId,
                model,
                tokens: response.usage?.total_tokens
            });

            return {
                message: assistantMessage,
                citations
            };
        } catch (error) {
            logger.error('Error handling regular response:', error);
            throw error;
        }
    }

    async handleStreamingResponse({ sessionId, messages, citations, model, res }) {
        try {
            // Create stream
            const streamId = streamingService.createStream(sessionId, res);

            // Get streaming response from LLM
            const llmStream = await llmFactory.createStreamingCompletion({
                messages,
                model,
                temperature: 0.7,
                maxTokens: 2000
            });

            let fullContent = '';

            // Process stream
            await streamingService.processLLMStream(
                streamId,
                llmStream,
                (chunk) => {
                    fullContent += chunk;
                },
                async (content) => {
                    // Save assistant message after streaming completes
                    const assistantMessage = await messageService.createMessage({
                        sessionId,
                        role: 'assistant',
                        content,
                        metadata: {
                            model,
                            citations
                        }
                    });

                    // Queue async processing
                    await chatQueue.addAnalyticsJob({
                        sessionId,
                        messageId: assistantMessage.id,
                        model
                    });
                }
            );

            return { streamId };
        } catch (error) {
            logger.error('Error handling streaming response:', error);
            throw error;
        }
    }

    async regenerateResponse(sessionId, messageId, model = 'gpt-4') {
        try {
            // Get the message to regenerate
            const message = await messageService.getMessage(messageId);

            if (message.role !== 'assistant') {
                throw new Error('Can only regenerate assistant messages');
            }

            // Get the previous user message
            const messages = await messageService.getSessionMessages(sessionId);
            const messageIndex = messages.findIndex(m => m.id === messageId);

            if (messageIndex <= 0) {
                throw new Error('Cannot find previous user message');
            }

            const userMessage = messages[messageIndex - 1];

            // Delete the old assistant message
            await messageService.deleteMessage(messageId);

            // Generate new response
            return await this.sendMessage({
                sessionId,
                content: userMessage.content,
                model
            });
        } catch (error) {
            logger.error('Error regenerating response:', error);
            throw error;
        }
    }
}

module.exports = new ChatService();
