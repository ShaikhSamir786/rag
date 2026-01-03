const axios = require('axios');

class ProxyService {
    constructor() {
        // Map service names to URLs (should be env vars in production)
        this.services = {
            'auth-service': process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
            'document-service': process.env.DOCUMENT_SERVICE_URL || 'http://document-service:3002',
            'query-service': process.env.QUERY_SERVICE_URL || 'http://query-service:3004'
        };
    }

    async forward(serviceName, path, config = {}) {
        const baseUrl = this.services[serviceName];
        if (!baseUrl) {
            throw new Error(\`Service \${serviceName} not found\`);
    }

    try {
      const response = await axios({
        ...config,
        url: \`\${baseUrl}\${path}\`
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || error.message);
      }
      throw error;
    }
  }
}

module.exports = { ProxyService };
