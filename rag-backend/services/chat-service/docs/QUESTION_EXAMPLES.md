# Question Generation Feature - Usage Examples

## Table of Contents
- [Basic Usage](#basic-usage)
- [Advanced Usage](#advanced-usage)
- [Integration Examples](#integration-examples)
- [Frontend Examples](#frontend-examples)

---

## Basic Usage

### Example 1: Generate Questions for Current File

```javascript
const questionGenerator = require('./core/services/question-generator.service');

// Generate questions for a file
const questions = await questionGenerator.generateQuestions({
    sessionId: 'session-123',
    userId: 'user-456',
    tenantId: 'tenant-789',
    context: {
        currentFile: 's:/projects/myapp/src/services/payment.service.js',
        cursorPosition: { line: 42, column: 10 },
        openFiles: ['payment.service.js', 'payment.model.js']
    },
    questionCount: 5
});

console.log(`Generated ${questions.length} questions`);
questions.forEach((q, i) => {
    console.log(`${i + 1}. [${q.category}] ${q.question}`);
});
```

### Example 2: Generate Questions for Selected Code

```javascript
const questions = await questionGenerator.generateQuestions({
    sessionId: 'session-123',
    userId: 'user-456',
    tenantId: 'tenant-789',
    context: {
        selectedCode: `
            async function processPayment(amount, userId) {
                const user = await User.findById(userId);
                if (!user) throw new Error('User not found');
                
                const payment = await stripe.charges.create({
                    amount: amount * 100,
                    currency: 'usd',
                    customer: user.stripeId
                });
                
                return payment;
            }
        `,
        currentFile: 'payment.service.js'
    },
    questionCount: 5,
    categories: ['technical', 'best-practice', 'debugging']
});
```

### Example 3: Generate Follow-up Questions

```javascript
const followUpQuestions = await questionGenerator.generateFollowUpQuestions({
    sessionId: 'session-123',
    userId: 'user-456',
    tenantId: 'tenant-789',
    previousQuestionId: 'question-abc',
    conversationHistory: [
        {
            role: 'user',
            content: 'How should I handle payment errors?'
        },
        {
            role: 'assistant',
            content: 'You should implement try-catch blocks and handle specific error types...'
        }
    ]
});
```

---

## Advanced Usage

### Example 4: Using the Repository Directly

```javascript
const questionRepository = require('./core/repositories/question.repository');

// Get all questions for a session
const sessionQuestions = await questionRepository.findBySession('session-123', {
    category: 'debugging',
    answered: false
});

// Get popular questions
const popularQuestions = await questionRepository.getPopularQuestions({
    tenantId: 'tenant-789',
    category: 'best-practice',
    limit: 10
});

// Submit feedback
await questionRepository.updateFeedback('question-id', 'tenant-789', {
    helpful: true,
    rating: 5,
    comment: 'Very helpful!'
});
```

### Example 5: Using Codebase Analyzer

```javascript
const codebaseAnalyzer = require('./core/services/codebase-analyzer.service');

// Analyze a file
const fileAnalysis = await codebaseAnalyzer.analyzeFile(
    's:/projects/myapp/src/services/auth.service.js'
);

console.log('File Analysis:', {
    language: fileAnalysis.language,
    lines: fileAnalysis.lines,
    complexity: fileAnalysis.complexity,
    hasTests: fileAnalysis.hasTests
});

// Extract dependencies
const dependencies = await codebaseAnalyzer.extractDependencies(
    's:/projects/myapp/src/services/auth.service.js'
);

console.log('Dependencies:', dependencies);

// Detect patterns
const patterns = await codebaseAnalyzer.detectPatterns({
    currentFile: 's:/projects/myapp/src/services/auth.service.js',
    selectedCode: '...'
});

console.log('Detected Patterns:', patterns);
```

### Example 6: Using Cache

```javascript
const questionCache = require('./infrastructure/cache/question-cache');

// Get cache statistics
const stats = await questionCache.getStats();
console.log('Cache Stats:', {
    hits: stats.hits,
    misses: stats.misses,
    hitRate: `${stats.hitRate}%`
});

// Invalidate cache for a file
await questionCache.invalidateFile('payment.service.js');

// Clear all cache
await questionCache.clear();
```

### Example 7: Using Queue

```javascript
const questionQueue = require('./infrastructure/queue/question-queue');

// Add generation job to queue
const job = await questionQueue.addGenerationJob({
    sessionId: 'session-123',
    userId: 'user-456',
    tenantId: 'tenant-789',
    context: { /* ... */ },
    questionCount: 5,
    priority: 1 // High priority
});

console.log('Job added:', job.id);

// Get queue statistics
const queueStats = await questionQueue.getStats();
console.log('Queue Stats:', queueStats);
```

---

## Integration Examples

### Example 8: Integrate with Chat Service

```javascript
// In chat.service.js

const questionGenerator = require('./question-generator.service');

class ChatService {
    async sendMessage({ sessionId, userId, content, model = 'gpt-4' }) {
        // ... existing chat logic ...

        // Generate suggested questions after user message
        const suggestedQuestions = await this.suggestQuestions(
            sessionId,
            userId,
            req.tenant?.id,
            content
        );

        return {
            message: assistantMessage,
            citations,
            suggestedQuestions // Include in response
        };
    }

    async suggestQuestions(sessionId, userId, tenantId, userMessage) {
        try {
            const questions = await questionGenerator.generateQuestions({
                sessionId,
                userId,
                tenantId,
                context: {
                    selectedCode: userMessage,
                    currentFile: ''
                },
                questionCount: 3
            });

            return questions;
        } catch (error) {
            logger.error('Error generating suggested questions:', error);
            return [];
        }
    }
}
```

### Example 9: Add Rate Limiting

```javascript
// In question.routes.js

const rateLimit = require('express-rate-limit');

const questionRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: 'Too many question generation requests'
});

router.post(
    '/questions/generate',
    questionRateLimiter, // Add rate limiter
    questionValidator.validateGenerateRequest,
    questionController.generateQuestions
);
```

---

## Frontend Examples

### Example 10: React Component

```jsx
import React, { useState } from 'react';
import axios from 'axios';

function QuestionGenerator({ sessionId, currentFile, selectedCode }) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const generateQuestions = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/api/questions/generate', {
                sessionId,
                context: {
                    currentFile,
                    selectedCode,
                    cursorPosition: { line: 0, column: 0 }
                },
                questionCount: 5
            });

            setQuestions(response.data.data.questions);
        } catch (error) {
            console.error('Error generating questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const submitFeedback = async (questionId, helpful, rating) => {
        try {
            await axios.post(`/api/questions/${questionId}/feedback`, {
                helpful,
                rating,
                actionTaken: 'answered'
            });
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    };

    return (
        <div className="question-generator">
            <button onClick={generateQuestions} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Questions'}
            </button>

            <div className="questions-list">
                {questions.map((q, index) => (
                    <div key={q.id} className="question-item">
                        <h4>{index + 1}. {q.question}</h4>
                        <span className="category">{q.category}</span>
                        <p className="reasoning">{q.reasoning}</p>
                        
                        <div className="feedback">
                            <button onClick={() => submitFeedback(q.id, true, 5)}>
                                👍 Helpful
                            </button>
                            <button onClick={() => submitFeedback(q.id, false, 1)}>
                                👎 Not Helpful
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default QuestionGenerator;
```

### Example 11: Vue.js Component

```vue
<template>
  <div class="question-generator">
    <button @click="generateQuestions" :disabled="loading">
      {{ loading ? 'Generating...' : 'Generate Questions' }}
    </button>

    <div v-for="(question, index) in questions" :key="question.id" class="question">
      <h4>{{ index + 1 }}. {{ question.question }}</h4>
      <span class="badge">{{ question.category }}</span>
      <p>{{ question.reasoning }}</p>
      
      <div class="actions">
        <button @click="submitFeedback(question.id, true, 5)">Helpful</button>
        <button @click="submitFeedback(question.id, false, 1)">Not Helpful</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QuestionGenerator',
  props: ['sessionId', 'currentFile', 'selectedCode'],
  data() {
    return {
      questions: [],
      loading: false
    };
  },
  methods: {
    async generateQuestions() {
      this.loading = true;
      try {
        const response = await this.$axios.post('/api/questions/generate', {
          sessionId: this.sessionId,
          context: {
            currentFile: this.currentFile,
            selectedCode: this.selectedCode
          },
          questionCount: 5
        });

        this.questions = response.data.data.questions;
      } catch (error) {
        console.error('Error:', error);
      } finally {
        this.loading = false;
      }
    },

    async submitFeedback(questionId, helpful, rating) {
      try {
        await this.$axios.post(`/api/questions/${questionId}/feedback`, {
          helpful,
          rating,
          actionTaken: 'answered'
        });
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }
};
</script>
```

---

## Testing Examples

### Example 12: Unit Test

```javascript
// tests/unit/services/question-generator.service.test.js

const questionGenerator = require('../../../src/core/services/question-generator.service');

describe('QuestionGeneratorService', () => {
    test('should generate questions for code context', async () => {
        const questions = await questionGenerator.generateQuestions({
            sessionId: 'test-session',
            userId: 'test-user',
            tenantId: 'test-tenant',
            context: {
                selectedCode: 'async function test() { await fetch(...) }',
                currentFile: 'test.js'
            },
            questionCount: 5
        });

        expect(questions).toHaveLength(5);
        expect(questions[0]).toHaveProperty('question');
        expect(questions[0]).toHaveProperty('category');
        expect(questions[0]).toHaveProperty('relevanceScore');
    });

    test('should categorize questions correctly', async () => {
        const category = await questionGenerator.categorizeQuestion(
            'Why is this function async?',
            {}
        );

        expect(category).toBe('clarification');
    });
});
```

### Example 13: Integration Test

```javascript
// tests/integration/question-api.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('Question API', () => {
    test('POST /api/questions/generate', async () => {
        const response = await request(app)
            .post('/api/questions/generate')
            .send({
                sessionId: 'test-session',
                context: {
                    currentFile: 'test.js',
                    selectedCode: 'function test() {}'
                },
                questionCount: 3
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.questions).toHaveLength(3);
    });

    test('POST /api/questions/:id/feedback', async () => {
        const response = await request(app)
            .post('/api/questions/test-id/feedback')
            .send({
                helpful: true,
                rating: 5,
                comment: 'Great question!'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});
```

---

## Best Practices

1. **Always provide context**: More context = better questions
2. **Use appropriate question counts**: 3-5 for quick, 8-10 for comprehensive
3. **Submit feedback**: Helps improve question quality over time
4. **Cache wisely**: Questions are cached for 1 hour
5. **Handle errors gracefully**: Always wrap in try-catch
6. **Monitor performance**: Check cache hit rates and queue stats
