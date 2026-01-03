# Chat Service

Enterprise-grade chat service with RAG (Retrieval-Augmented Generation) capabilities, built with Clean Architecture principles.

## Features

- **Multi-LLM Support**: OpenAI GPT-4, GPT-3.5, Claude 3 Opus, Claude 3 Sonnet
- **RAG Integration**: Retrieval-Augmented Generation for context-aware responses
- **Real-time Streaming**: Server-Sent Events (SSE) for streaming responses
- **WebSocket Support**: Real-time bidirectional communication
- **Session Management**: Persistent chat sessions with metadata
- **Message History**: Complete conversation history with export capabilities
- **Caching**: Redis-based caching for sessions and messages
- **Async Processing**: Bull queue for background job processing
- **Rate Limiting**: Per-session and per-user rate limiting
- **Feedback System**: Message rating and feedback collection

## Architecture

The service follows Clean Architecture with clear separation of concerns:

```
src/
├── api/              # API layer (controllers, routes, middlewares, validators)
├── core/             # Business logic (services, repositories, factories)
├── domain/           # Domain models and entities
├── infrastructure/   # External integrations (database, cache, LLM, queue)
├── workers/          # Background job processors
├── config/           # Configuration files
└── utils/            # Utility functions
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3006

# MongoDB
MONGODB_URI=mongodb://mongodb:27017/chat-service

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# OpenAI
OPENAI_API_KEY=your_key_here

# Anthropic
ANTHROPIC_API_KEY=your_key_here

# Query Service
QUERY_SERVICE_URL=http://query-service:3004
```

## Usage

```bash
# Development
npm run dev

# Production
npm start

# Tests
npm test
```

## API Endpoints

### Sessions

- `POST /api/sessions` - Create a new chat session
- `GET /api/sessions` - Get user's sessions
- `GET /api/sessions/:sessionId` - Get session details
- `PUT /api/sessions/:sessionId` - Update session
- `DELETE /api/sessions/:sessionId` - Delete session
- `POST /api/sessions/:sessionId/archive` - Archive session

### Chat

- `POST /api/chat` - Send a message (non-streaming)
- `POST /api/chat/stream` - Send a message (streaming)
- `POST /api/chat/regenerate` - Regenerate last response

### Messages

- `GET /api/sessions/:sessionId/messages` - Get messages
- `GET /api/messages/:messageId` - Get single message
- `POST /api/messages/:messageId/feedback` - Add feedback
- `DELETE /api/messages/:messageId` - Delete message

### History

- `GET /api/sessions/:sessionId/history` - Get conversation history
- `GET /api/sessions/:sessionId/history/export` - Export history
- `DELETE /api/sessions/:sessionId/history` - Clear history

## Database Schema

### Session
```javascript
{
  userId: String,
  title: String,
  metadata: {
    model: String,
    temperature: Number,
    maxTokens: Number
  },
  isActive: Boolean,
  lastMessageAt: Date
}
```

### Message
```javascript
{
  sessionId: ObjectId,
  role: String, // 'user' | 'assistant' | 'system'
  content: String,
  metadata: {
    tokens: Number,
    model: String,
    citations: Array
  },
  feedback: {
    rating: String,
    comment: String
  }
}
```

## Technologies

- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Cache**: Redis (ioredis)
- **Queue**: Bull
- **LLM**: OpenAI, Anthropic
- **WebSocket**: Socket.IO
- **Validation**: express-validator

## License

MIT
