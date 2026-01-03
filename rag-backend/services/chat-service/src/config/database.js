module.exports = {
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://mongodb:27017/chat-service',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 2
        }
    },

    // Connection retry settings
    retry: {
        attempts: 5,
        delay: 5000
    }
};
