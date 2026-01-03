const { DocumentService } = require('../../core/services/document.service');
const { asyncHandler } = require('@rag-platform/common');
const { logger } = require('@rag-platform/logger');

const documentService = new DocumentService();

class DocumentController {
  /**
   * POST /documents
   * Upload single file
   */
  upload = asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const tenantId = req.headers['x-tenant-id'] || req.tenant?.id;
    const userId = req.headers['x-user-id'] || req.user?.id;
    const { sessionId } = req.body;

    if (!tenantId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing tenant or user information',
      });
    }

    logger.info('Document upload started', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    const result = await documentService.upload(req.file, userId, tenantId, sessionId);

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  /**
   * POST /documents/batch
   * Upload multiple files
   */
  uploadMultiple = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
    }

    const tenantId = req.headers['x-tenant-id'] || req.tenant?.id;
    const userId = req.headers['x-user-id'] || req.user?.id;
    const { sessionId } = req.body;

    if (!tenantId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing tenant or user information',
      });
    }

    logger.info('Multiple files upload started', {
      count: req.files.length,
    });

    const results = await documentService.uploadMultiple(req.files, userId, tenantId, sessionId);

    res.status(201).json({
      success: true,
      data: results,
    });
  });

  /**
   * GET /documents/:id
   * Get document by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] || req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing tenant information',
      });
    }

    const document = await documentService.getById(id, tenantId);

    res.json({
      success: true,
      data: document,
    });
  });

  /**
   * GET /documents
   * List documents with pagination
   */
  list = asyncHandler(async (req, res) => {
    const tenantId = req.headers['x-tenant-id'] || req.tenant?.id;
    const userId = req.headers['x-user-id'] || req.user?.id;
    const {
      status,
      page = 1,
      limit = 20,
      orderBy = 'createdAt',
      order = 'DESC',
    } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing tenant information',
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows, count } = await documentService.list({
      tenantId,
      userId,
      status,
      limit: parseInt(limit),
      offset,
      orderBy,
      order: order.toUpperCase(),
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  });

  /**
   * DELETE /documents/:id
   * Delete document
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] || req.tenant?.id;
    const userId = req.headers['x-user-id'] || req.user?.id;

    if (!tenantId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing tenant or user information',
      });
    }

    await documentService.delete(id, userId, tenantId);

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  });

  /**
   * GET /documents/:id/chunks
   * Get document chunks
   */
  getChunks = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] || req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing tenant information',
      });
    }

    const chunks = await documentService.getChunks(id, tenantId);

    res.json({
      success: true,
      data: chunks,
    });
  });

  /**
   * GET /documents/:id/status
   * Get document processing status
   */
  getStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] || req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing tenant information',
      });
    }

    const status = await documentService.getStatus(id, tenantId);

    res.json({
      success: true,
      data: status,
    });
  });

  /**
   * GET /documents/statistics
   * Get document statistics
   */
  getStatistics = asyncHandler(async (req, res) => {
    const tenantId = req.headers['x-tenant-id'] || req.tenant?.id;
    const userId = req.headers['x-user-id'] || req.user?.id;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing tenant information',
      });
    }

    const statistics = await documentService.getStatistics(tenantId, userId);

    res.json({
      success: true,
      data: statistics,
    });
  });
}

module.exports = { DocumentController };
