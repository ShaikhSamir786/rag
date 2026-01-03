# Deployment Guide

## Prerequisites
- **Docker** & **Docker Compose**
- **Node.js** 20+ (for local development without Docker)
- **pnpm** (Package Manager)

## Quick Start (Docker)

1.  **Clone the repository**
2.  **Configure Environment**
    Copy `env.example` to `.env` and fill in the secrets.
    ```bash
    cp env.example .env
    ```
    *Critical variables to set:*
    - `OPENAI_API_KEY` or `GEMINI_API_KEY`
    - `PINECONE_API_KEY` & `PINECONE_INDEX`
    - `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY` (for S3)

3.  **Run with Docker Compose**
    ```bash
    docker-compose up --build
    ```
    This will start:
    - Postgres (5432)
    - Redis (6379)
    - MongoDB (27017)
    - All Microservices
    - Nginx Gateway (3000)

4.  **Access the API**
    The API Gateway is available at `http://localhost:3000`.

## Service Configuration

### Environment Variables
Each service can be configured individually via the `docker-compose.yml` `environment` section or the root `.env` file.

| Service | Port | Key Env Vars |
| :--- | :--- | :--- |
| **API Gateway** | 3000 | `PORT_API_GATEWAY`, `JWT_SECRET` |
| **Auth Service** | 3001 | `DATABASE_URL`, `JWT_SECRET` |
| **Document Service** | 3002 | `AWS_ACCESS_KEY_ID`, `S3_BUCKET` |
| **Embedding Service** | - | `OPENAI_API_KEY`, `PINECONE_API_KEY` |
| **Query Service** | 3004 | `PINECONE_API_KEY` |
| **Chat Service** | 3006 | `MONGO_URI`, `OPENAI_API_KEY` |

## Scaling

### Horizontal Scaling
The architecture supports horizontal scaling for stateless services.
```bash
docker-compose up -d --scale document-service=3
```
*Note: Nginx configuration might need adjustment to load balance dynamically if not using a service mesh or Swarm/K8s DNS.*

### Queue Workers
The `embedding-service` and document processors are worker-based. You can scale them independently to handle higher ingestion loads without affecting API availability.
