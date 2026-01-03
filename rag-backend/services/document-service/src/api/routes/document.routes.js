const express = require('express');
const { DocumentController } = require('../controllers/document.controller');
const { uploadSingle, uploadMultiple } = require('../middlewares/upload.middleware');
const { validateFileType, validateMultipleFiles } = require('../middlewares/file-validation.middleware');
const { asyncHandler } = require('@rag-platform/common');

const router = express.Router();
const controller = new DocumentController();

// Upload single file
router.post(
  '/',
  uploadSingle('file'),
  validateFileType,
  controller.upload
);

// Upload multiple files
router.post(
  '/batch',
  uploadMultiple('files', 5),
  validateMultipleFiles,
  controller.uploadMultiple
);

// List documents (must come before /:id)
router.get('/', controller.list);

// Get statistics (must come before /:id)
router.get('/statistics/overview', controller.getStatistics);

// Get document by ID
router.get('/:id', controller.getById);

// Get document chunks
router.get('/:id/chunks', controller.getChunks);

// Get document status
router.get('/:id/status', controller.getStatus);

// Delete document
router.delete('/:id', controller.delete);

module.exports = router;
