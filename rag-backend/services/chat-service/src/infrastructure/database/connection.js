const mongoose = require('mongoose');
const { logger } = require('@rag-platform/logger');

class DatabaseConnection {
    constructor() {
        this.connection = null;
    }

    async connect() {
        try {
            const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/chat-service';

            this.connection = await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            logger.info('MongoDB connected successfully');

            // Handle connection events
            mongoose.connection.on('error', (err) => {
                logger.error('MongoDB connection error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
            });

            mongoose.connection.on('reconnected', () => {
                logger.info('MongoDB reconnected');
            });

            return this.connection;
        } catch (error) {
            logger.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }

    async disconnect() {
        try {
            await mongoose.disconnect();
            logger.info('MongoDB disconnected successfully');
        } catch (error) {
            logger.error('Error disconnecting from MongoDB:', error);
            throw error;
        }
    }

    getConnection() {
        return this.connection;
    }

    isConnected() {
        return mongoose.connection.readyState === 1;
    }
}

module.exports = new DatabaseConnection();
