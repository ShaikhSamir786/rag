const { QueueManager } = require('@rag-platform/queue');

const queueManager = QueueManager.getInstance();

// Create queues
const webhookQueue = queueManager.createQueue('webhook-processing', {
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        },
        removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000
        },
        removeOnFail: {
            age: 7 * 24 * 3600 // Keep failed jobs for 7 days
        }
    }
});

const invoiceQueue = queueManager.createQueue('invoice-generation', {
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: {
            age: 24 * 3600,
            count: 500
        }
    }
});

const paymentStatusQueue = queueManager.createQueue('payment-status-update', {
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000
        },
        removeOnComplete: {
            age: 12 * 3600,
            count: 500
        }
    }
});

module.exports = {
    webhookQueue,
    invoiceQueue,
    paymentStatusQueue,
    queueManager
};


