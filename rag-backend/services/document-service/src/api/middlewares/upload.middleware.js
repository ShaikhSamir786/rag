const multer = require('multer');
const upload = require('../../config/multer.config');
const { logger } = require('@rag-platform/logger');

/**
 * Handle multer errors
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    logger.error('Multer error:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE || 10485760} bytes`,
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: `Too many files. Maximum is ${process.env.MAX_FILES || 5} files`,
      });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field',
      });
    }

    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  if (error) {
    logger.error('Upload error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'File upload failed',
    });
  }

  next();
};

/**
 * Single file upload
 */
const uploadSingle = (fieldName = 'file') => {
  return [upload.single(fieldName), handleUploadError];
};

/**
 * Multiple files upload
 */
const uploadMultiple = (fieldName = 'files', maxCount = 5) => {
  return [upload.array(fieldName, maxCount), handleUploadError];
};

/**
 * Mixed file upload
 */
const uploadFields = (fields) => {
  return [upload.fields(fields), handleUploadError];
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleUploadError,
};

