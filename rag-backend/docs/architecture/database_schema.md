# Database Schema & Data Models

## Overview
The platform uses a polyglot persistence layer:
- **PostgreSQL**: Relational data (Users, Billing, Metadata).
- **MongoDB**: Chat history and unstructured session data.
- **Redis**: Caching, Queues, and Pub/Sub.
- **Pinecone**: Vector embeddings.
- **TimescaleDB**: Time-series analytics (optional/extension of Postgres).

## PostgreSQL Schema

### Users & Auth
- **users**: `id, email, password_hash, role, tenant_id, created_at`
- **sessions**: `id, user_id, refresh_token, expires_at`
- **tenants**: `id, name, plan, status`

### Billing
- **subscriptions**: `id, tenant_id, plan_id, status, current_period_end`
- **invoices**: `id, tenant_id, amount, status, pdf_url`
- **payments**: `id, invoice_id, amount, provider_id`

### Documents
- **documents**: `id, tenant_id, user_id, s3_key, filename, mime_type, status`
- **document_chunks**: `id, document_id, chunk_index, content_hash, embedding_id`

## MongoDB Collections (Chat Service)

### chats
- **sessions**: `_id, userId, tenantId, title, createdAt, updatedAt`
- **messages**: `_id, sessionId, role (user/assistant), content, metadata (tokens, model), createdAt`

## Redis Keys
- `session:{id}`: Active user session data.
- `ratelimit:{ip}`: API rate limiting counters.
- `queue:{name}`: BullMQ job queues (document-processing, embedding).

## Vector Database (Pinecone)
- **Namespace**: Per-tenant isolation (e.g., `tenant_{id}`).
- **Metadata**: `document_id`, `chunk_index`, `source`, `page_number`.
