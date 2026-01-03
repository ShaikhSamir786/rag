const { fromFile } = require('file-type');
const path = require('path');
const { logger } = require('@rag-platform/logger');

const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md', '.jpg', '.jpeg', '.png', '.gif', '.webp'];

/**
 * Validate file type using file-type library
 */
const validateFileType = async (req, res, next) => {
  try {
    const file = req.file || (req.files && req.files[0]);

    if (!file) {
      return next();
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({
        success: false,
        error: `Invalid file extension: ${ext}. Allowed extensions: ${allowedExtensions.join(', ')}`,
      });
    }

    // Verify file signature using file-type
    try {
      const fileType = await fromFile(file.path);

      if (!fileType) {
        return res.status(400).json({
          success: false,
          error: 'Unable to determine file type. File may be corrupted.',
        });
      }

      // Check if MIME type matches
      if (!allowedMimeTypes.includes(fileType.mime)) {
        return res.status(400).json({
          success: false,
          error: `Invalid file type: ${fileType.mime}. Allowed types: ${allowedMimeTypes.join(', ')}`,
        });
      }

      // Verify MIME type matches declared type
      if (file.mimetype && file.mimetype !== fileType.mime) {
        logger.warn('MIME type mismatch', {
          declared: file.mimetype,
          detected: fileType.mime,
          filename: file.originalname,
        });
        // Update the mimetype to the detected one
        file.mimetype = fileType.mime;
      }

      // Attach detected file type to file object
      file.detectedMimeType = fileType.mime;
      file.detectedExt = fileType.ext;

      next();
    } catch (error) {
      logger.error('File type detection error:', error);
      return res.status(400).json({
        success: false,
        error: 'Failed to validate file type',
      });
    }
  } catch (error) {
    logger.error('File validation error:', error);
    next(error);
  }
};

/**
 * Validate multiple files
 */
const validateMultipleFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({
          success: false,
          error: `Invalid file extension: ${ext} in file ${file.originalname}`,
        });
      }

      const fileType = await fromFile(file.path);
      if (!fileType || !allowedMimeTypes.includes(fileType.mime)) {
        return res.status(400).json({
          success: false,
          error: `Invalid file type in ${file.originalname}`,
        });
      }

      file.detectedMimeType = fileType.mime;
      file.detectedExt = fileType.ext;
    }

    next();
  } catch (error) {
    logger.error('Multiple file validation error:', error);
    next(error);
  }
};

module.exports = {
  validateFileType,
  validateMultipleFiles,
};

