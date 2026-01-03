const llmFactory = require('../../infrastructure/llm/llm-factory');
const codebaseAnalyzer = require('./codebase-analyzer.service');
const questionTemplate = require('./question-template.service');
const questionRepository = require('../repositories/question.repository');
const questionCache = require('../../infrastructure/cache/question-cache');
const { logger } = require('@rag-platform/logger');
const crypto = require('crypto');

/**
 * Question Generator Service
 * Generates intelligent, context-aware questions similar to Cursor AI
 */
class QuestionGeneratorService {
    constructor() {
        this.maxQuestionsPerRequest = parseInt(process.env.QUESTION_MAX_PER_REQUEST || '10', 10);
        this.generationModel = process.env.QUESTION_GENERATION_MODEL || 'gpt-4';
        this.temperature = parseFloat(process.env.QUESTION_GENERATION_TEMPERATURE || '0.7');
        this.maxTokens = parseInt(process.env.QUESTION_MAX_TOKENS || '500', 10);
    }

    /**
     * Generate questions based on context
     * @param {Object} options - Generation options
     * @param {string} options.sessionId - Chat session ID
     * @param {string} options.userId - User ID
     * @param {string} options.tenantId - Tenant ID
     * @param {Object} options.context - Context information
     * @param {number} options.questionCount - Number of questions to generate
     * @param {string[]} options.categories - Question categories to focus on
     * @returns {Promise<Object[]>} Generated questions
     */
    async generateQuestions({ sessionId, userId, tenantId, context, questionCount = 5, categories = [] }) {
        try {
            // Validate question count
            const count = Math.min(questionCount, this.maxQuestionsPerRequest);

            // Generate cache key from context
            const cacheKey = this._generateCacheKey(context);

            // Check cache first
            const cachedQuestions = await questionCache.get(cacheKey);
            if (cachedQuestions) {
                logger.info('Returning cached questions', { cacheKey });
                return cachedQuestions.slice(0, count);
            }

            // Analyze codebase context
            logger.info('Analyzing codebase context', { context });
            const analysis = await codebaseAnalyzer.analyzeContext(context);

            // Build prompt for question generation
            const prompt = await questionTemplate.buildQuestionPrompt({
                context,
                analysis,
                questionCount: count,
                categories
            });

            // Generate questions using LLM
            logger.info('Generating questions with LLM', { model: this.generationModel });
            const response = await llmFactory.createChatCompletion({
                messages: [
                    {
                        role: 'system',
                        content: this._getSystemPrompt()
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: this.generationModel,
                temperature: this.temperature,
                maxTokens: this.maxTokens
            });

            // Parse and process generated questions
            const rawQuestions = this._parseQuestions(response.choices[0].message.content);

            // Categorize and rank questions
            const processedQuestions = await this._processQuestions(rawQuestions, analysis, context);

            // Save questions to database
            const savedQuestions = await this._saveQuestions({
                questions: processedQuestions,
                sessionId,
                userId,
                tenantId,
                context,
                metadata: {
                    model: this.generationModel,
                    tokens: response.usage?.total_tokens,
                    analysisData: analysis
                }
            });

            // Cache the results
            await questionCache.set(cacheKey, savedQuestions);

            logger.info('Questions generated successfully', { count: savedQuestions.length });
            return savedQuestions;

        } catch (error) {
            logger.error('Error generating questions:', error);
            throw error;
        }
    }

    /**
     * Generate follow-up questions based on conversation history
     * @param {Object} options - Follow-up options
     * @returns {Promise<Object[]>} Follow-up questions
     */
    async generateFollowUpQuestions({ sessionId, userId, tenantId, previousQuestionId, conversationHistory }) {
        try {
            // Get previous question context
            const previousQuestion = await questionRepository.findById(previousQuestionId, tenantId);
            if (!previousQuestion) {
                throw new Error('Previous question not found');
            }

            // Build follow-up prompt
            const prompt = await questionTemplate.buildFollowUpPrompt({
                previousQuestion,
                conversationHistory
            });

            // Generate follow-up questions
            const response = await llmFactory.createChatCompletion({
                messages: [
                    {
                        role: 'system',
                        content: this._getFollowUpSystemPrompt()
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: this.generationModel,
                temperature: this.temperature,
                maxTokens: this.maxTokens
            });

            const rawQuestions = this._parseQuestions(response.choices[0].message.content);
            const processedQuestions = await this._processQuestions(rawQuestions, {}, previousQuestion.context);

            // Save follow-up questions
            const savedQuestions = await this._saveQuestions({
                questions: processedQuestions,
                sessionId,
                userId,
                tenantId,
                context: previousQuestion.context,
                metadata: {
                    model: this.generationModel,
                    tokens: response.usage?.total_tokens,
                    parentQuestionId: previousQuestionId
                }
            });

            return savedQuestions;

        } catch (error) {
            logger.error('Error generating follow-up questions:', error);
            throw error;
        }
    }

    /**
     * Rank questions by relevance
     * @param {Object[]} questions - Questions to rank
     * @returns {Object[]} Ranked questions
     */
    async rankQuestions(questions) {
        try {
            // Sort by relevance score (already calculated during processing)
            return questions.sort((a, b) => b.relevanceScore - a.relevanceScore);
        } catch (error) {
            logger.error('Error ranking questions:', error);
            throw error;
        }
    }

    /**
     * Categorize a question
     * @param {string} question - Question text
     * @param {Object} context - Context information
     * @returns {Promise<string>} Question category
     */
    async categorizeQuestion(question, context) {
        try {
            const categories = [
                'clarification',
                'technical',
                'architectural',
                'best-practice',
                'debugging'
            ];

            // Use simple keyword matching for now
            // Can be enhanced with ML classification later
            const lowerQuestion = question.toLowerCase();

            if (lowerQuestion.includes('why') || lowerQuestion.includes('what is') || lowerQuestion.includes('explain')) {
                return 'clarification';
            }
            if (lowerQuestion.includes('how to') || lowerQuestion.includes('implement')) {
                return 'technical';
            }
            if (lowerQuestion.includes('architecture') || lowerQuestion.includes('design') || lowerQuestion.includes('structure')) {
                return 'architectural';
            }
            if (lowerQuestion.includes('best practice') || lowerQuestion.includes('should') || lowerQuestion.includes('recommend')) {
                return 'best-practice';
            }
            if (lowerQuestion.includes('error') || lowerQuestion.includes('bug') || lowerQuestion.includes('fix')) {
                return 'debugging';
            }

            return 'technical'; // Default category
        } catch (error) {
            logger.error('Error categorizing question:', error);
            return 'technical';
        }
    }

    /**
     * Get system prompt for question generation
     * @private
     */
    _getSystemPrompt() {
        return `You are an expert software development assistant that generates intelligent, context-aware questions to help developers understand and improve their code.

Your task is to analyze the provided code context and generate insightful questions that:
1. Help clarify unclear aspects of the code
2. Identify potential issues or improvements
3. Explore architectural decisions
4. Suggest best practices
5. Aid in debugging

Generate questions that are:
- Specific to the code context provided
- Actionable and clear
- Avoid generic or obvious queries
- Properly formatted as a JSON array

Return ONLY a JSON array of question objects with this structure:
[
  {
    "question": "The question text",
    "category": "clarification|technical|architectural|best-practice|debugging",
    "reasoning": "Why this question is relevant",
    "priority": "high|medium|low"
  }
]`;
    }

    /**
     * Get system prompt for follow-up questions
     * @private
     */
    _getFollowUpSystemPrompt() {
        return `You are an expert software development assistant that generates intelligent follow-up questions based on conversation history.

Generate follow-up questions that:
1. Build on previous questions and answers
2. Dive deeper into the topic
3. Explore related areas
4. Help complete understanding

Return ONLY a JSON array of question objects with this structure:
[
  {
    "question": "The question text",
    "category": "clarification|technical|architectural|best-practice|debugging",
    "reasoning": "Why this question is relevant",
    "priority": "high|medium|low"
  }
]`;
    }

    /**
     * Parse questions from LLM response
     * @private
     */
    _parseQuestions(content) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                logger.warn('No JSON array found in response, returning empty array');
                return [];
            }

            const questions = JSON.parse(jsonMatch[0]);
            return Array.isArray(questions) ? questions : [];
        } catch (error) {
            logger.error('Error parsing questions:', error);
            return [];
        }
    }

    /**
     * Process and enhance questions
     * @private
     */
    async _processQuestions(rawQuestions, analysis, context) {
        const processedQuestions = [];

        for (const rawQuestion of rawQuestions) {
            try {
                // Calculate relevance score
                const relevanceScore = this._calculateRelevanceScore(rawQuestion, analysis);

                // Ensure category is valid
                const category = await this.categorizeQuestion(rawQuestion.question, context);

                processedQuestions.push({
                    question: rawQuestion.question,
                    category: category,
                    reasoning: rawQuestion.reasoning || '',
                    priority: rawQuestion.priority || 'medium',
                    relevanceScore,
                    context: {
                        file: context.currentFile || '',
                        lineNumber: context.cursorPosition?.line || 0,
                        codeSnippet: context.selectedCode || '',
                        relatedFiles: context.openFiles || [],
                        detectedPatterns: analysis.patterns || []
                    }
                });
            } catch (error) {
                logger.error('Error processing question:', error);
            }
        }

        return processedQuestions;
    }

    /**
     * Calculate relevance score for a question
     * @private
     */
    _calculateRelevanceScore(question, analysis) {
        let score = 50; // Base score

        // Increase score based on priority
        if (question.priority === 'high') score += 30;
        else if (question.priority === 'medium') score += 15;

        // Increase score if question references detected patterns
        if (analysis.patterns && analysis.patterns.length > 0) {
            const questionLower = question.question.toLowerCase();
            for (const pattern of analysis.patterns) {
                if (questionLower.includes(pattern.toLowerCase())) {
                    score += 10;
                }
            }
        }

        // Increase score if question is specific (contains code-related keywords)
        const codeKeywords = ['function', 'class', 'method', 'variable', 'import', 'export', 'async', 'await'];
        const questionLower = question.question.toLowerCase();
        for (const keyword of codeKeywords) {
            if (questionLower.includes(keyword)) {
                score += 5;
                break;
            }
        }

        return Math.min(score, 100); // Cap at 100
    }

    /**
     * Save questions to database
     * @private
     */
    async _saveQuestions({ questions, sessionId, userId, tenantId, context, metadata }) {
        const savedQuestions = [];

        for (const question of questions) {
            try {
                const saved = await questionRepository.create({
                    sessionId,
                    userId,
                    tenantId,
                    question: question.question,
                    category: question.category,
                    context: question.context,
                    relevanceScore: question.relevanceScore,
                    metadata: {
                        ...metadata,
                        reasoning: question.reasoning,
                        priority: question.priority
                    }
                });

                savedQuestions.push(saved);
            } catch (error) {
                logger.error('Error saving question:', error);
            }
        }

        return savedQuestions;
    }

    /**
     * Generate cache key from context
     * @private
     */
    _generateCacheKey(context) {
        const contextString = JSON.stringify({
            file: context.currentFile,
            line: context.cursorPosition?.line,
            selected: context.selectedCode?.substring(0, 100) // First 100 chars
        });

        return crypto.createHash('md5').update(contextString).digest('hex');
    }
}

module.exports = new QuestionGeneratorService();
