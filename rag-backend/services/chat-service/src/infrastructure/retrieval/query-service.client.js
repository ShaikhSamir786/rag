const axios = require('axios');
const { logger } = require('@rag-platform/logger');

class QueryServiceClient {
    constructor() {
        this.baseUrl = process.env.QUERY_SERVICE_URL || 'http://query-service:3004';
    }

    async search({ query, topK = 5, threshold = 0.7, filters = {} }) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/search`,
                {
                    query,
                    topK,
                    threshold,
                    filters
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            return response.data;
        } catch (error) {
            logger.error('Query service error:', error.response?.data || error.message);
            throw new Error(`Query service error: ${error.response?.data?.message || error.message}`);
        }
    }

    async getContext({ query, topK = 5, threshold = 0.7 }) {
        try {
            const results = await this.search({ query, topK, threshold });

            if (!results || !results.results || results.results.length === 0) {
                return {
                    context: '',
                    citations: []
                };
            }

            const context = results.results
                .map((result, index) => `[${index + 1}] ${result.content}`)
                .join('\n\n');

            const citations = results.results.map((result, index) => ({
                index: index + 1,
                source: result.metadata?.source || 'Unknown',
                content: result.content,
                score: result.score
            }));

            return { context, citations };
        } catch (error) {
            logger.error('Error getting context from query service:', error);
            return {
                context: '',
                citations: []
            };
        }
    }

    async healthCheck() {
        try {
            const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
            return response.data;
        } catch (error) {
            logger.error('Query service health check failed:', error.message);
            return { status: 'error', message: error.message };
        }
    }
}

module.exports = new QueryServiceClient();
