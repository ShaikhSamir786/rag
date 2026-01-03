const OpenAI = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');

class QueryService {
    constructor() {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        this.index = this.pinecone.index(process.env.PINECONE_INDEX || 'rag-index');
    }

    async query(question, userId, tenantId) {
        // 1. Generate embedding for question
        const embedding = await this.openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: question
        });
        const vector = embedding.data[0].embedding;

        // 2. Retrieve relevant docs from Pinecone
        const namespace = \`tenant-\${tenantId}\`;
    const results = await this.index.namespace(namespace).query({
      vector,
      topK: 5,
      includeMetadata: true
    });

    const context = results.matches.map(m => m.metadata.text).join('\n\n');

    // 3. Generate answer
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Use the provided context to answer the question.' },
        { role: 'user', content: \`Context:\n\${context}\n\nQuestion: \${question}\` }
      ]
    });

    return {
      answer: completion.choices[0].message.content,
      sources: results.matches.map(m => ({ documentId: m.metadata.documentId, score: m.score }))
    };
  }
}

module.exports = { QueryService };
