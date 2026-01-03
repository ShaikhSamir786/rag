const mongoose = require('mongoose');
const { logger } = require('@rag-platform/logger');

const connectMongoDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://admin:admin123@mongodb:27017/chat_service?authSource=admin';
        await mongoose.connect(mongoURI);
        logger.info('Chat Service connected to MongoDB');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = { connectMongoDB };
