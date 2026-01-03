module.exports = {
  // Storage backend selection
  backend: process.env.STORAGE_BACKEND || 's3', // 's3' or 'local'

  // S3 configuration
  s3: {
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'rag-documents',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.S3_ENDPOINT, // For S3-compatible services
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  },

  // Local storage configuration
  local: {
    basePath: process.env.LOCAL_STORAGE_PATH || 'uploads/documents',
    createDirectories: true,
    preserveStructure: true, // tenant/user structure
  },

  // Upload settings
  upload: {
    tempDir: process.env.UPLOAD_TEMP_DIR || 'uploads/temp',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    cleanupTempFiles: true,
    cleanupAfterHours: 24,
  },
};

