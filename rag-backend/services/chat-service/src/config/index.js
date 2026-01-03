module.exports = {
    // Server
    port: process.env.PORT || 3006,
    env: process.env.NODE_ENV || 'development',

    // Database
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://mongodb:27017/chat-service',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        }
    },

    // Redis
    redis: {
        host: process.env.REDIS_HOST || 'redis',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        sessionDb: 1,
        messageDb: 2
    },

    // LLM Providers
    llm: {
        openai: {
            apiKey: process.env.OPENAI_API_KEY,
            baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
            defaultModel: 'gpt-4'
        },
        anthropic: {
            apiKey: process.env.ANTHROPIC_API_KEY,
            baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
            defaultModel: 'claude-3-sonnet-20240229'
        }
    },

    // Query Service (RAG)
    queryService: {
        url: process.env.QUERY_SERVICE_URL || 'http://query-service:3004',
        timeout: 10000
    },

    // Chat Settings
    chat: {
        defaultModel: 'gpt-4',
        defaultTemperature: 0.7,
        defaultMaxTokens: 2000,
        maxHistoryMessages: 50,
        ragEnabled: true,
        ragTopK: 5,
        ragThreshold: 0.7
    },

    // Cache Settings
    cache: {
        sessionTTL: 3600, // 1 hour
        messageTTL: 1800, // 30 minutes
        maxCachedMessages: 50
    },

    // Queue Settings
    queue: {
        redis: {
            host: process.env.REDIS_HOST || 'redis',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD
        },
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            }
        }
    },

    // Rate Limiting
    rateLimit: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 60,
        maxMessagesPerSession: 100
    },

    // CORS
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true
    }
};
