const { logger } = require('@rag-platform/logger');

/**
 * Question Formatter
 * Formats questions for display with markdown and code snippets
 */
class QuestionFormatter {
    /**
     * Format a single question
     * @param {Object} question - Question object
     * @param {Object} options - Formatting options
     * @returns {string} Formatted question
     */
    formatQuestion(question, options = {}) {
        try {
            const parts = [];

            // Question text
            if (options.numbered) {
                parts.push(`**${options.number || 1}. ${question.question}**`);
            } else {
                parts.push(`**${question.question}**`);
            }

            // Category badge
            if (options.showCategory !== false && question.category) {
                const badge = this._getCategoryBadge(question.category);
                parts.push(`\n${badge}`);
            }

            // Priority indicator
            if (options.showPriority && question.metadata?.priority) {
                const priority = this._getPriorityIndicator(question.metadata.priority);
                parts.push(` ${priority}`);
            }

            // Reasoning
            if (options.showReasoning && question.metadata?.reasoning) {
                parts.push(`\n\n*${question.metadata.reasoning}*`);
            }

            // Code snippet
            if (options.showCode && question.context?.codeSnippet) {
                parts.push('\n\n```javascript');
                parts.push(question.context.codeSnippet);
                parts.push('```');
            }

            // Context information
            if (options.showContext && question.context) {
                parts.push(this._formatContext(question.context));
            }

            // Relevance score
            if (options.showScore && question.relevanceScore) {
                parts.push(`\n\n*Relevance: ${question.relevanceScore}/100*`);
            }

            return parts.join('');

        } catch (error) {
            logger.error('Error formatting question:', error);
            return question.question || '';
        }
    }

    /**
     * Format multiple questions
     * @param {Object[]} questions - Array of questions
     * @param {Object} options - Formatting options
     * @returns {string} Formatted questions
     */
    formatQuestions(questions, options = {}) {
        try {
            if (!questions || questions.length === 0) {
                return 'No questions available.';
            }

            const formatted = questions.map((q, index) => {
                return this.formatQuestion(q, {
                    ...options,
                    numbered: true,
                    number: index + 1
                });
            });

            return formatted.join('\n\n---\n\n');

        } catch (error) {
            logger.error('Error formatting questions:', error);
            return '';
        }
    }

    /**
     * Format questions by category
     * @param {Object[]} questions - Array of questions
     * @returns {string} Formatted questions grouped by category
     */
    formatByCategory(questions) {
        try {
            const grouped = this._groupByCategory(questions);
            const parts = [];

            for (const [category, categoryQuestions] of Object.entries(grouped)) {
                parts.push(`## ${this._getCategoryName(category)}\n`);
                parts.push(this.formatQuestions(categoryQuestions, {
                    showCategory: false,
                    showReasoning: true
                }));
                parts.push('\n');
            }

            return parts.join('\n');

        } catch (error) {
            logger.error('Error formatting questions by category:', error);
            return '';
        }
    }

    /**
     * Format question for API response
     * @param {Object} question - Question object
     * @returns {Object} Formatted question for API
     */
    formatForAPI(question) {
        return {
            id: question.id || question._id?.toString(),
            question: question.question,
            category: question.category,
            relevanceScore: question.relevanceScore,
            priority: question.metadata?.priority || 'medium',
            reasoning: question.metadata?.reasoning || '',
            context: {
                file: question.context?.file || '',
                lineNumber: question.context?.lineNumber || 0,
                codeSnippet: question.context?.codeSnippet || '',
                relatedFiles: question.context?.relatedFiles || []
            },
            answered: question.answered || false,
            feedback: question.feedback || null,
            createdAt: question.createdAt
        };
    }

    /**
     * Get category badge
     * @private
     */
    _getCategoryBadge(category) {
        const badges = {
            'clarification': '🔍 Clarification',
            'technical': '⚙️ Technical',
            'architectural': '🏗️ Architectural',
            'best-practice': '✨ Best Practice',
            'debugging': '🐛 Debugging'
        };

        return `*${badges[category] || category}*`;
    }

    /**
     * Get priority indicator
     * @private
     */
    _getPriorityIndicator(priority) {
        const indicators = {
            'high': '🔴',
            'medium': '🟡',
            'low': '🟢'
        };

        return indicators[priority] || '';
    }

    /**
     * Get category name
     * @private
     */
    _getCategoryName(category) {
        const names = {
            'clarification': 'Clarification Questions',
            'technical': 'Technical Questions',
            'architectural': 'Architectural Questions',
            'best-practice': 'Best Practice Questions',
            'debugging': 'Debugging Questions'
        };

        return names[category] || category;
    }

    /**
     * Format context information
     * @private
     */
    _formatContext(context) {
        const parts = ['\n\n**Context:**'];

        if (context.file) {
            parts.push(`\n- File: \`${context.file}\``);
        }

        if (context.lineNumber) {
            parts.push(`\n- Line: ${context.lineNumber}`);
        }

        if (context.detectedPatterns && context.detectedPatterns.length > 0) {
            parts.push(`\n- Patterns: ${context.detectedPatterns.join(', ')}`);
        }

        if (context.relatedFiles && context.relatedFiles.length > 0) {
            parts.push(`\n- Related files: ${context.relatedFiles.length}`);
        }

        return parts.join('');
    }

    /**
     * Group questions by category
     * @private
     */
    _groupByCategory(questions) {
        const grouped = {};

        questions.forEach(question => {
            const category = question.category || 'technical';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(question);
        });

        return grouped;
    }

    /**
     * Create summary of questions
     * @param {Object[]} questions - Array of questions
     * @returns {string} Summary
     */
    createSummary(questions) {
        if (!questions || questions.length === 0) {
            return 'No questions generated.';
        }

        const byCategory = this._groupByCategory(questions);
        const parts = [`Generated ${questions.length} question(s):`];

        for (const [category, categoryQuestions] of Object.entries(byCategory)) {
            parts.push(`- ${this._getCategoryName(category)}: ${categoryQuestions.length}`);
        }

        const avgScore = questions.reduce((sum, q) => sum + (q.relevanceScore || 0), 0) / questions.length;
        parts.push(`\nAverage relevance: ${avgScore.toFixed(1)}/100`);

        return parts.join('\n');
    }
}

module.exports = new QuestionFormatter();
