const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

class QueueManager {
    constructor() {
        this.queues = new Map();
        this.workers = new Map();
        // Default connection, should probably be configurable
        this.connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
    }

    static getInstance() {
        if (!QueueManager.instance) {
            QueueManager.instance = new QueueManager();
        }
        return QueueManager.instance;
    }

    createQueue(name, options = {}) {
        if (!this.queues.has(name)) {
            const queue = new Queue(name, {
                connection: this.connection,
                ...options
            });
            this.queues.set(name, queue);
        }
        return this.queues.get(name);
    }

    getQueue(name) {
        return this.queues.get(name);
    }

    createWorker(name, processor, options = {}) {
        if (!this.workers.has(name)) {
            const worker = new Worker(name, processor, {
                connection: this.connection,
                ...options
            });
            this.workers.set(name, worker);
        }
        return this.workers.get(name);
    }
}

module.exports = { QueueManager };
