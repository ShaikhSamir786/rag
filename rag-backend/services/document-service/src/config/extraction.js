module.exports = {
  // Supported file types
  supportedTypes: {
    'application/pdf': {
      extractor: 'pdf',
      maxSize: 50 * 1024 * 1024, // 50MB
      timeout: 60000, // 60 seconds
    },
    'application/msword': {
      extractor: 'docx', // Use mammoth for .doc files too
      maxSize: 20 * 1024 * 1024, // 20MB
      timeout: 30000,
    },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      extractor: 'docx',
      maxSize: 20 * 1024 * 1024, // 20MB
      timeout: 30000,
    },
    'text/plain': {
      extractor: 'txt',
      maxSize: 10 * 1024 * 1024, // 10MB
      timeout: 10000,
    },
    'text/markdown': {
      extractor: 'txt',
      maxSize: 10 * 1024 * 1024, // 10MB
      timeout: 10000,
    },
  },

  // Extraction settings
  settings: {
    pdf: {
      extractMetadata: true,
      extractText: true,
      maxPages: 1000,
    },
    docx: {
      preserveFormatting: false,
      extractImages: false,
    },
    txt: {
      encoding: 'utf-8',
      detectEncoding: true,
    },
  },

  // Chunking defaults
  chunking: {
    defaultChunkSize: 1000,
    defaultOverlap: 200,
    maxChunkSize: 2000,
    minChunkSize: 100,
  },
};

