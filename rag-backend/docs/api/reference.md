# API Reference

This document outlines the primary REST API endpoints exposed by the API Gateway.

**Base URL**: `http://localhost:3000/api` (via Nginx/Gateway)

## Authentication (`/auth`)

| Method | Endpoint | Description | Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Log in a user | `{ email, password }` |
| `POST` | `/auth/register` | Register a new user | `{ email, password, name, ... }` |

## Documents (`/documents`)

Manages file ingestion and processing.

| Method | Endpoint | Description | Request |
| :--- | :--- | :--- | :--- |
| `GET` | `/documents` | List uploaded documents | Query params: `page`, `limit` |
| `POST` | `/documents` | Upload a single file | `multipart/form-data`: `file` |
| `POST` | `/documents/batch` | Upload multiple files | `multipart/form-data`: `files` (max 5) |
| `GET` | `/documents/:id` | Get document metadata | - |
| `GET` | `/documents/:id/status` | Get processing status | - |
| `GET` | `/documents/:id/chunks` | Get generated text chunks | - |
| `DELETE` | `/documents/:id` | Delete a document | - |

## Chat (`/chat`)

Interact with the RAG system.

| Method | Endpoint | Description | Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/chat` | Send a message (non-streaming) | `{ sessionId, message, model }` |
| `POST` | `/chat/stream` | Send a message (streaming) | `{ sessionId, message, model }` |
| `POST` | `/chat/regenerate` | Regenerate the last response | `{ sessionId, messageId }` |

## Health

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | API Gateway health check |

---

## Headers

Most endpoints require the following headers:
- `Authorization`: `Bearer <token>` (received from login)
- `x-tenant-id`: Tenant Identifier (for multi-tenancy)
