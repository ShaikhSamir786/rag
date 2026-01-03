# Question Generation API Documentation

## Overview

The Question Generation API provides intelligent, context-aware question generation for code analysis. It uses LLM-based analysis to generate relevant questions based on codebase context.

---

## Endpoints

### 1. Generate Questions

Generate questions based on code context.

**Endpoint**: `POST /api/questions/generate`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "sessionId": "string (required)",
  "context": {
    "currentFile": "string (optional)",
    "cursorPosition": {
      "line": "number",
      "column": "number"
    },
    "selectedCode": "string (optional)",
    "openFiles": ["string"],
    "recentChanges": []
  },
  "questionCount": "number (1-10, default: 5)",
  "categories": ["clarification", "technical", "architectural", "best-practice", "debugging"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "string",
        "question": "string",
        "category": "string",
        "relevanceScore": "number (0-100)",
        "priority": "high|medium|low",
        "reasoning": "string",
        "context": {
          "file": "string",
          "lineNumber": "number",
          "codeSnippet": "string",
          "relatedFiles": ["string"],
          "detectedPatterns": ["string"]
        },
        "answered": false,
        "createdAt": "ISO date string"
      }
    ],
    "count": "number"
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3003/api/questions/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "abc123",
    "context": {
      "currentFile": "/path/to/file.js",
      "cursorPosition": { "line": 10, "column": 5 },
      "selectedCode": "async function example() { ... }"
    },
    "questionCount": 5
  }'
```

---

### 2. Get Question History

Retrieve question history for a session.

**Endpoint**: `GET /api/questions/history/:sessionId`

**Query Parameters**:
- `category` (optional): Filter by category
- `answered` (optional): Filter by answered status (true/false)

**Response**:
```json
{
  "success": true,
  "data": {
    "questions": [...],
    "count": "number"
  }
}
```

**Example**:
```bash
curl http://localhost:3003/api/questions/history/abc123?category=technical&answered=false
```

---

### 3. Get Question Details

Get details of a specific question.

**Endpoint**: `GET /api/questions/:questionId`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "question": "string",
    ...
  }
}
```

---

### 4. Submit Feedback

Submit feedback on a question's helpfulness.

**Endpoint**: `POST /api/questions/:questionId/feedback`

**Request Body**:
```json
{
  "helpful": "boolean (required)",
  "rating": "number (1-5, required)",
  "comment": "string (optional)",
  "actionTaken": "answered|dismissed|modified|none"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    ...updated question
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3003/api/questions/xyz789/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "helpful": true,
    "rating": 5,
    "comment": "Very helpful question!",
    "actionTaken": "answered"
  }'
```

---

### 5. Generate Follow-up Questions

Generate follow-up questions based on conversation history.

**Endpoint**: `POST /api/questions/follow-up`

**Request Body**:
```json
{
  "sessionId": "string (required)",
  "previousQuestionId": "string (required)",
  "conversationHistory": [
    {
      "role": "user|assistant",
      "content": "string"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "questions": [...],
    "count": "number"
  }
}
```

---

### 6. Get Popular Questions

Get popular questions based on user feedback.

**Endpoint**: `GET /api/questions/popular`

**Query Parameters**:
- `category` (optional): Filter by category
- `limit` (optional): Number of questions (default: 10)

**Response**:
```json
{
  "success": true,
  "data": {
    "questions": [...],
    "count": "number"
  }
}
```

---

### 7. Get Statistics

Get question generation statistics.

**Endpoint**: `GET /api/questions/statistics`

**Query Parameters**:
- `startDate` (optional): Start date for statistics

**Response**:
```json
{
  "success": true,
  "data": {
    "totalFeedback": "number",
    "averageRating": "number",
    "helpfulCount": "number",
    "actionCounts": []
  }
}
```

---

### 8. Delete Question

Delete a question.

**Endpoint**: `DELETE /api/questions/:questionId`

**Response**:
```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

**Common Error Codes**:
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 50 per window
- **Applies to**: All question generation endpoints

When rate limit is exceeded:
```json
{
  "success": false,
  "error": "Too many question generation requests, please try again later"
}
```

---

## Question Categories

1. **clarification** - Questions to clarify unclear aspects
2. **technical** - Questions about implementation details
3. **architectural** - Questions about design and structure
4. **best-practice** - Questions about code quality and standards
5. **debugging** - Questions to help identify and fix issues

---

## Best Practices

### 1. Provide Rich Context

Include as much context as possible for better question quality:
```json
{
  "context": {
    "currentFile": "/path/to/file.js",
    "cursorPosition": { "line": 42, "column": 10 },
    "selectedCode": "actual code snippet",
    "openFiles": ["/path/to/related1.js", "/path/to/related2.js"]
  }
}
```

### 2. Use Appropriate Question Count

- For quick analysis: 3-5 questions
- For comprehensive review: 8-10 questions

### 3. Filter by Category

Request specific categories when you know what you need:
```json
{
  "categories": ["debugging", "best-practice"]
}
```

### 4. Provide Feedback

Always provide feedback to improve question quality:
```json
{
  "helpful": true,
  "rating": 5,
  "actionTaken": "answered"
}
```

---

## Performance Tips

1. **Caching**: Questions are cached for 1 hour based on context
2. **Async Processing**: Use queue for large codebase analysis
3. **Batch Requests**: Generate multiple questions in one request
4. **Filter Results**: Use category and answered filters to reduce payload

---

## Examples

### Example 1: Analyze New Function

```javascript
const response = await fetch('/api/questions/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session-123',
    context: {
      currentFile: 'src/services/payment.service.js',
      selectedCode: `
        async function processPayment(amount, userId) {
          const user = await User.findById(userId);
          // ... payment logic
        }
      `,
      cursorPosition: { line: 15, column: 0 }
    },
    questionCount: 5,
    categories: ['technical', 'best-practice']
  })
});

const { questions } = await response.json();
```

### Example 2: Get Unanswered Questions

```javascript
const response = await fetch(
  '/api/questions/history/session-123?answered=false'
);

const { questions } = await response.json();
```

### Example 3: Submit Feedback

```javascript
await fetch(`/api/questions/${questionId}/feedback`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    helpful: true,
    rating: 5,
    comment: 'This helped me identify the issue!',
    actionTaken: 'answered'
  })
});
```

---

## Integration with Chat Service

Questions can be automatically suggested during chat:

```javascript
// After user sends a message
const questions = await questionGenerator.generateQuestions({
  sessionId,
  userId,
  tenantId,
  context: {
    selectedCode: userMessage.content,
    currentFile: userMessage.metadata?.file
  },
  questionCount: 3
});

// Display questions to user
displaySuggestedQuestions(questions);
```

---

## Monitoring

Monitor question generation performance:

```bash
# Get cache statistics
GET /api/questions/cache/stats

# Get queue statistics
GET /api/questions/queue/stats
```
