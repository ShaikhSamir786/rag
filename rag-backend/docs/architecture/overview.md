# Technical Architecture Documentation
## Enterprise RAG Platform

### 1. Project Overview
The Enterprise RAG Platform is a scalable, microservices-based system designed to provide Retrieval-Augmented Generation (RAG) capabilities for enterprise applications. It is built as a monorepo using **Node.js** and **pnpm workspaces**, featuring a modular architecture that separates concerns between ingestion, retrieval, generation, and support services.

### 2. Technology Stack

#### Core Backend
- **Runtime**: Node.js (>=20.0.0)
- **Frameworks**: Express.js, Apollo Server (GraphQL)
- **Language**: JavaScript (ES6+)
- **Monorepo Management**: pnpm workspaces

#### Databases & Storage
- **Relational**: PostgreSQL (via Sequelize) - Used for user data, sessions, billing, and document metadata.
- **Vector**: Pinecone - Stores document embeddings for semantic search.
- **Cache**: Redis (via ioredis) - Caching sessions, rate limiting, and temporary data.
- **Object Storage**: AWS S3 (compatible) - Stores raw document files.
- **Analytics**: TimescaleDB / ClickHouse - High-volume event logging and usage metrics.

#### AI & ML
- **LLM Providers**: OpenAI (GPT-4, GPT-3.5), Anthropic (Claude 3).
- **Embeddings**: OpenAI, Google Generative AI.
- **Frameworks**: Custom LLM factory and context builders (no heavy dependency on LangChain).

#### Infrastructure & Messaging
- **Containerization**: Docker, Docker Compose.
- **Message Queues**: BullMQ / RabbitMQ (Redis-based) - Handles asynchronous tasks like document processing and embedding.
- **API Gateway**: Custom Node.js gateway for routing and proxying.

---

### 3. System Architecture & Modules

The system is divided into **Services** (standalone microservices) and **Packages** (shared libraries).

#### 3.1. Microservices (`/services`)

| Service | Responsibility | Key Technologies |
| :--- | :--- | :--- |
| **API Gateway** | Unified entry point, request routing, websocket handling, and initial auth validation. | Express, http-proxy |
| **Auth Service** | User identity, JWT issuance, OAuth (Google/GitHub), RBAC, and session management. | Passport, JWT, Sequelize |
| **Chat Service** | Orchestrates the RAG flow. Manages chat sessions, builds prompts with context, and communicates with LLMs. | OpenAI SDK, Anthropic SDK |
| **Document Service** | Handles file uploads, storage (S3), and initiates the processing pipeline. Manages document metadata. | Multer, AWS SDK, pdf-parse |
| **Embedding Service** | Worker-based service that consumes text chunks, generates embeddings, and upserts them to the vector DB. | Pinecone Client, BullMQ |
| **Query Service** | specialized service for semantic search. Retrieves relevant context from Pinecone based on user queries. | GraphQL, Pinecone Client |
| **Analytics Service** | Tracks system usage, token consumption, and performance metrics. | GraphQL, ClickHouse/TimescaleDB |
| **Billing Service** | Manages subscriptions, payments, and invoices. | Stripe/PayPal SDKs |

#### 3.2. Shared Packages (`/packages`)

- **@rag-platform/common**: Shared error classes, middlewares (auth, validation), and utilities.
- **@rag-platform/database**: Centralized database connection logic and base repository patterns.
- **@rag-platform/logger**: Standardized logging configuration (Winston/Pino wrapper).
- **@rag-platform/queue**: Shared queue configurations and worker interfaces.
- **@rag-platform/events**: Event bus definitions for inter-service communication.

---

### 4. Key Workflows

#### 4.1. Document Ingestion Pipeline
This workflow transforms raw files into searchable vectors.

1.  **Upload**: User uploads a file via `POST /documents`.
2.  **Storage**: `Document Service` stores the file in S3 and saves metadata in PostgreSQL.
3.  **Queuing**: A job is added to the `document-processing` queue.
4.  **Processing**: A worker extracts text from the file (PDF, DOCX, etc.) and chunks it.
5.  **Embedding**: Chunks are sent to the `embedding` queue.
6.  **Vectorization**: `Embedding Service` consumes the job, generates embeddings via an external provider (e.g., OpenAI), and stores vectors in **Pinecone**.

#### 4.2. RAG Chat Workflow
This workflow handles user questions and generates answers using context.

1.  **User Request**: User sends a message to `Chat Service`.
2.  **Context Building**:
    -   `Chat Service` calls `ContextService`.
    -   `ContextService` requests relevant context from `Query Service`.
3.  **Retrieval**:
    -   `Query Service` searches **Pinecone** for vectors similar to the user's query.
    -   Returns top-k text chunks and citations.
4.  **Prompt Construction**: `Chat Service` combines the System Prompt, Retrieved Context, Conversation History, and User Question.
5.  **Generation**: The constructed prompt is sent to the LLM (OpenAI/Anthropic).
6.  **Response**: The LLM's response is streamed back to the user, and the interaction is logged for analytics.

---

### 5. Directory Structure

```text
rag-backend/
├── config/                 # Global environment configs
├── infrastructure/         # Docker & Nginx setup
├── packages/               # Shared libraries
│   ├── common/             # Utilities & Middlewares
│   ├── database/           # DB connections & Base models
│   ├── events/             # Event definitions
│   ├── logger/             # Logging wrapper
│   └── queue/              # Queue setup
├── services/               # Microservices
│   ├── analytics-service/  # Reporting & Metrics
│   ├── api-gateway/        # Routing & Proxy
│   ├── auth-service/       # Identity & Access
│   ├── billing-service/    # Payments
│   ├── chat-service/       # RAG Orchestration (Core)
│   ├── document-service/   # File Ingestion
│   ├── embedding-service/  # Vector Generation Worker
│   └── query-service/      # Vector Retrieval
└── docker-compose.yml      # Orchestration
```

### 6. Development & Deployment
- **Local Development**: `docker-compose up` spins up all services, including databases (Postgres, Redis).
- **Dependencies**: Managed via `pnpm` for efficient workspace caching.
- **Environment**: Configuration is handled via `config/` files and environment variables.
