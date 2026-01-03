# Cursor AI-Style Question Generation Feature

## Overview

This feature provides intelligent, context-aware question generation for code analysis, similar to Cursor AI. It analyzes codebase context and generates relevant questions to help developers understand and improve their code.

## Features

✅ **Intelligent Question Generation**
- LLM-powered question generation
- Context-aware analysis
- Multiple question categories (clarification, technical, architectural, best-practice, debugging)
- Relevance scoring and ranking

✅ **Codebase Analysis**
- File structure analysis
- Dependency extraction
- Pattern detection (async/await, promises, error handling, etc.)
- Framework detection

✅ **Performance Optimizations**
- Redis caching (1-hour TTL)
- BullMQ async processing
- Rate limiting (50 requests per 15 minutes)

✅ **Feedback System**
- Question helpfulness ratings
- User comments
- Action tracking (answered, dismissed, modified)
- Popular questions aggregation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Question Generation Flow                 │
└─────────────────────────────────────────────────────────────┘

1. USER REQUEST
   ↓
2. CONTEXT EXTRACTION
   - Current file
   - Selected code
   - Cursor position
   - Open files
   ↓
3. CODEBASE ANALYSIS
   - Pattern detection
   - Dependency extraction
   - Framework identification
   ↓
4. CACHE CHECK
   - Check Redis cache
   - Return if cached
   ↓
5. LLM GENERATION
   - Build prompt
   - Call LLM API
   - Parse response
   ↓
6. PROCESSING
   - Categorize questions
   - Calculate relevance scores
   - Rank by priority
   ↓
7. STORAGE
   - Save to MongoDB
   - Cache in Redis
   ↓
8. RESPONSE
   - Return formatted questions
```

## Components

### Core Services
- **question-generator.service.js** - Main question generation logic
- **codebase-analyzer.service.js** - Code analysis and pattern detection
- **question-template.service.js** - Prompt engineering and templates

### Database Models
- **generated-question.model.js** - Question storage
- **question-feedback.model.js** - Feedback tracking

### API Layer
- **question.controller.js** - Request handlers
- **question.routes.js** - Route definitions
- **question.validator.js** - Input validation

### Infrastructure
- **question-cache.js** - Redis caching
- **question-queue.js** - BullMQ async processing

### Utilities
- **context-extractor.js** - Code context extraction
- **question-formatter.js** - Display formatting

## Quick Start

### 1. Install Dependencies

```bash
cd services/chat-service
npm install
```

Required packages:
- `glob` - File pattern matching
- `ignore` - Gitignore-style filtering
- `@babel/parser` - AST parsing
- `@babel/traverse` - AST traversal
- `fast-levenshtein` - String similarity
- `joi` - Validation
- `bullmq` - Queue processing

### 2. Configure Environment

Add to your `.env` file:

```bash
# Question Generation
QUESTION_GENERATION_ENABLED=true
QUESTION_MAX_PER_REQUEST=10
QUESTION_CACHE_TTL=3600
QUESTION_GENERATION_MODEL=gpt-4
QUESTION_GENERATION_TEMPERATURE=0.7
QUESTION_MAX_TOKENS=500

# Codebase Analysis
CODEBASE_ANALYSIS_ENABLED=true
CODEBASE_MAX_FILES_ANALYZE=100
CODEBASE_EXCLUDED_DIRS=node_modules,dist,build,.git
CODEBASE_EXCLUDED_EXTENSIONS=.log,.lock,.md

# Question Queue
QUESTION_QUEUE_ENABLED=true
QUESTION_QUEUE_CONCURRENCY=5
QUESTION_QUEUE_RETRY_ATTEMPTS=3
```

### 3. Start the Service

```bash
npm run dev
```

### 4. Generate Questions

```bash
curl -X POST http://localhost:3003/api/questions/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "context": {
      "currentFile": "/path/to/file.js",
      "selectedCode": "async function example() { ... }",
      "cursorPosition": { "line": 10, "column": 5 }
    },
    "questionCount": 5
  }'
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/questions/generate` | Generate questions |
| GET | `/api/questions/history/:sessionId` | Get question history |
| GET | `/api/questions/:questionId` | Get question details |
| POST | `/api/questions/:questionId/feedback` | Submit feedback |
| POST | `/api/questions/follow-up` | Generate follow-up questions |
| GET | `/api/questions/popular` | Get popular questions |
| GET | `/api/questions/statistics` | Get statistics |
| DELETE | `/api/questions/:questionId` | Delete question |

See [QUESTION_API.md](./docs/QUESTION_API.md) for detailed API documentation.

## Usage Examples

### Basic Usage

```javascript
const questionGenerator = require('./core/services/question-generator.service');

const questions = await questionGenerator.generateQuestions({
    sessionId: 'session-123',
    userId: 'user-456',
    tenantId: 'tenant-789',
    context: {
        currentFile: 'payment.service.js',
        selectedCode: 'async function processPayment() { ... }',
        cursorPosition: { line: 42, column: 10 }
    },
    questionCount: 5,
    categories: ['technical', 'best-practice']
});
```

### React Integration

```jsx
function QuestionPanel({ sessionId, code }) {
    const [questions, setQuestions] = useState([]);

    const generateQuestions = async () => {
        const response = await fetch('/api/questions/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                context: { selectedCode: code },
                questionCount: 5
            })
        });

        const data = await response.json();
        setQuestions(data.data.questions);
    };

    return (
        <div>
            <button onClick={generateQuestions}>Generate Questions</button>
            {questions.map(q => (
                <div key={q.id}>
                    <h4>{q.question}</h4>
                    <span>{q.category}</span>
                </div>
            ))}
        </div>
    );
}
```

See [QUESTION_EXAMPLES.md](./docs/QUESTION_EXAMPLES.md) for more examples.

## Question Categories

1. **Clarification** 🔍 - Questions to clarify unclear aspects
2. **Technical** ⚙️ - Questions about implementation details
3. **Architectural** 🏗️ - Questions about design and structure
4. **Best Practice** ✨ - Questions about code quality and standards
5. **Debugging** 🐛 - Questions to help identify and fix issues

## Performance

- **Question Generation**: < 3 seconds
- **Cache Hit Rate**: > 60% (target)
- **API Response Time**: < 500ms (cached)
- **Rate Limit**: 50 requests per 15 minutes

## Monitoring

### Cache Statistics

```javascript
const questionCache = require('./infrastructure/cache/question-cache');
const stats = await questionCache.getStats();

console.log(`Hit Rate: ${stats.hitRate}%`);
console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}`);
```

### Queue Statistics

```javascript
const questionQueue = require('./infrastructure/queue/question-queue');
const stats = await questionQueue.getStats();

console.log('Queue Stats:', stats);
```

## Testing

Run tests:

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Watch mode
npm run test:watch
```

## Documentation

- [API Documentation](./docs/QUESTION_API.md) - Complete API reference
- [Usage Examples](./docs/QUESTION_EXAMPLES.md) - Code examples
- [Environment Configuration](./docs/QUESTION_ENV.md) - Configuration guide

## Contributing

When adding new features:

1. Update relevant services
2. Add tests
3. Update documentation
4. Submit PR with description

## License

MIT
