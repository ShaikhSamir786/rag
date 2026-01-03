module.exports = {
  queues: {
    documentProcessing: {
      name: 'document-processing',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // 24 hours
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // 7 days
        },
      },
    },
    extraction: {
      name: 'document-extraction',
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 1000,
        },
      },
    },
    chunking: {
      name: 'document-chunking',
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 1000,
        },
      },
    },
    embedding: {
      name: 'document-embedding',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      },
    },
  },

  priorities: {
    high: 1,
    normal: 5,
    low: 10,
  },
};

