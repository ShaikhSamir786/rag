const OpenAI = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');

class EmbeddingService {
    constructor() {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        this.index = this.pinecone.index(process.env.PINECONE_INDEX || 'rag-index');
    }

    async createEmbedding(text) {
        const response = await this.openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: text
        });
        return response.data[0].embedding;
    }

    async storeEmbeddings(vectors, tenantId) {
        const namespace = \`tenant-\${tenantId}\`;
    await this.index.namespace(namespace).upsert(vectors);
  }
}

module.exports = { EmbeddingService };
