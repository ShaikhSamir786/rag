const { GoogleGenerativeAI } = require('@google/generative-ai');
const { logger } = require('@rag-platform/logger');

class GeminiService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    async createEmbedding(text) {
        try {
            const model = this.genAI.getGenerativeModel({ model: "embedding-001" });
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            logger.error('Gemini Embedding Error:', error);
            throw error;
        }
    }
}

module.exports = { GeminiService };
