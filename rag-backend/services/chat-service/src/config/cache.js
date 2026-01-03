module.exports = {
    redis: {
        host: process.env.REDIS_HOST || 'redis',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        }
    },

    session: {
        db: 1,
        ttl: 3600, // 1 hour
        keyPrefix: 'session:'
    },

    message: {
        db: 2,
        ttl: 1800, // 30 minutes
        maxCached: 50,
        keyPrefix: 'messages:'
    },

    // Cache warming settings
    warming: {
        enabled: true,
        onSessionCreate: true,
        onMessageCreate: true
    }
};
