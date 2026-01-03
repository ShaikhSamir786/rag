const { logger } = require('@rag-platform/logger');

/**
 * Question Template Service
 * Manages question templates and builds prompts for LLM
 */
class QuestionTemplateService {
    constructor() {
        this.templates = this._initializeTemplates();
    }

    /**
     * Build prompt for question generation
     * @param {Object} options - Prompt options
     * @returns {Promise<string>} Generated prompt
     */
    async buildQuestionPrompt({ context, analysis, questionCount, categories }) {
        try {
            const parts = [];

            // Add context information
            parts.push('## Code Context\n');

            if (context.currentFile) {
                parts.push(`**Current File:** \`${context.currentFile}\``);
            }

            if (context.cursorPosition) {
                parts.push(`**Cursor Position:** Line ${context.cursorPosition.line}, Column ${context.cursorPosition.column}`);
            }

            if (context.selectedCode) {
                parts.push(`\n**Selected Code:**\n\`\`\`\n${context.selectedCode}\n\`\`\``);
            }

            // Add analysis information
            if (analysis.currentFile) {
                parts.push(`\n## File Analysis`);
                parts.push(`- **Language:** ${analysis.currentFile.language}`);
                parts.push(`- **Lines of Code:** ${analysis.currentFile.lines}`);
                parts.push(`- **Complexity:** ${analysis.currentFile.complexity}`);
                parts.push(`- **Has Tests:** ${analysis.currentFile.hasTests ? 'Yes' : 'No'}`);
            }

            // Add detected patterns
            if (analysis.patterns && analysis.patterns.length > 0) {
                parts.push(`\n## Detected Patterns`);
                parts.push(analysis.patterns.map(p => `- ${p}`).join('\n'));
            }

            // Add framework information
            if (analysis.framework) {
                parts.push(`\n## Framework: ${analysis.framework}`);
            }

            // Add dependencies
            if (analysis.dependencies && analysis.dependencies.length > 0) {
                parts.push(`\n## Dependencies (${analysis.dependencies.length})`);
                const topDeps = analysis.dependencies.slice(0, 10);
                parts.push(topDeps.map(d => `- ${d}`).join('\n'));
            }

            // Add related files
            if (analysis.relatedFiles && analysis.relatedFiles.length > 0) {
                parts.push(`\n## Related Files`);
                parts.push(analysis.relatedFiles.map(f => `- ${f}`).join('\n'));
            }

            // Add instructions
            parts.push(`\n## Instructions`);
            parts.push(`Generate ${questionCount} insightful questions about this code.`);

            if (categories && categories.length > 0) {
                parts.push(`Focus on these categories: ${categories.join(', ')}`);
            }

            parts.push(`\nQuestions should help the developer:`);
            parts.push(`- Understand unclear aspects of the code`);
            parts.push(`- Identify potential improvements or issues`);
            parts.push(`- Learn about best practices`);
            parts.push(`- Make informed architectural decisions`);

            return parts.join('\n');

        } catch (error) {
            logger.error('Error building question prompt:', error);
            throw error;
        }
    }

    /**
     * Build prompt for follow-up questions
     * @param {Object} options - Follow-up options
     * @returns {Promise<string>} Generated prompt
     */
    async buildFollowUpPrompt({ previousQuestion, conversationHistory }) {
        try {
            const parts = [];

            parts.push('## Previous Question\n');
            parts.push(`**Question:** ${previousQuestion.question}`);
            parts.push(`**Category:** ${previousQuestion.category}`);

            if (previousQuestion.context) {
                parts.push(`\n**Context:**`);
                parts.push(`- File: ${previousQuestion.context.file}`);
                if (previousQuestion.context.codeSnippet) {
                    parts.push(`\n**Code:**\n\`\`\`\n${previousQuestion.context.codeSnippet}\n\`\`\``);
                }
            }

            // Add conversation history
            if (conversationHistory && conversationHistory.length > 0) {
                parts.push(`\n## Conversation History\n`);
                conversationHistory.slice(-5).forEach((msg, idx) => {
                    parts.push(`**${msg.role}:** ${msg.content.substring(0, 200)}...`);
                });
            }

            parts.push(`\n## Instructions`);
            parts.push(`Generate 3-5 follow-up questions that:`);
            parts.push(`- Build on the previous question`);
            parts.push(`- Dive deeper into the topic`);
            parts.push(`- Explore related areas`);
            parts.push(`- Help complete the developer's understanding`);

            return parts.join('\n');

        } catch (error) {
            logger.error('Error building follow-up prompt:', error);
            throw error;
        }
    }

    /**
     * Get template by category
     * @param {string} category - Question category
     * @returns {Object} Template
     */
    getTemplate(category) {
        return this.templates[category] || this.templates.default;
    }

    /**
     * Initialize question templates
     * @private
     */
    _initializeTemplates() {
        return {
            clarification: {
                name: 'Clarification Questions',
                description: 'Questions to clarify unclear aspects',
                examples: [
                    'What is the purpose of this function?',
                    'Why was this approach chosen over alternatives?',
                    'What does this variable represent?'
                ]
            },
            technical: {
                name: 'Technical Questions',
                description: 'Questions about implementation details',
                examples: [
                    'How does this function handle edge cases?',
                    'What happens if this API call fails?',
                    'How is this data structure optimized?'
                ]
            },
            architectural: {
                name: 'Architectural Questions',
                description: 'Questions about design and structure',
                examples: [
                    'Why is this pattern used here?',
                    'How does this component fit into the overall architecture?',
                    'What are the scalability implications?'
                ]
            },
            'best-practice': {
                name: 'Best Practice Questions',
                description: 'Questions about code quality and standards',
                examples: [
                    'Is this following best practices?',
                    'Should this be refactored?',
                    'Are there security concerns here?'
                ]
            },
            debugging: {
                name: 'Debugging Questions',
                description: 'Questions to help identify and fix issues',
                examples: [
                    'What could cause this error?',
                    'How can this bug be reproduced?',
                    'What are the potential failure points?'
                ]
            },
            default: {
                name: 'General Questions',
                description: 'General questions about the code',
                examples: [
                    'What does this code do?',
                    'How can this be improved?',
                    'What are the dependencies?'
                ]
            }
        };
    }

    /**
     * Format question for display
     * @param {Object} question - Question object
     * @returns {string} Formatted question
     */
    formatQuestion(question) {
        let formatted = `**${question.question}**\n`;

        if (question.category) {
            formatted += `*Category: ${question.category}*\n`;
        }

        if (question.reasoning) {
            formatted += `\n${question.reasoning}\n`;
        }

        if (question.context && question.context.codeSnippet) {
            formatted += `\n\`\`\`\n${question.context.codeSnippet}\n\`\`\`\n`;
        }

        return formatted;
    }
}

module.exports = new QuestionTemplateService();
