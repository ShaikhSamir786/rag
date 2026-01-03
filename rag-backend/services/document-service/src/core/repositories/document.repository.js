const { Document } = require('../../domain/models/document.model');
const { DocumentChunk } = require('../../domain/models/document-chunk.model');
const { Op, fn, col } = require('sequelize');

class DocumentRepository {
  /**
   * Create document
   */
  async create(data) {
    return await Document.create(data);
  }

  /**
   * Find document by ID
   */
  async findById(id, tenantId = null) {
    const where = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }
    return await Document.findOne({ where });
  }

  /**
   * Find document with chunks
   */
  async findByIdWithChunks(id, tenantId = null) {
    const where = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }
    return await Document.findOne({
      where,
      include: [
        {
          model: DocumentChunk,
          as: 'chunks',
          order: [['chunkIndex', 'ASC']],
        },
      ],
    });
  }

  /**
   * Find all documents with pagination
   */
  async findAll(options = {}) {
    const {
      tenantId,
      userId,
      status,
      limit = 20,
      offset = 0,
      orderBy = 'createdAt',
      order = 'DESC',
    } = options;

    const where = {};
    if (tenantId) where.tenantId = tenantId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    return await Document.findAndCountAll({
      where,
      limit,
      offset,
      order: [[orderBy, order]],
    });
  }

  /**
   * Update document
   */
  async update(id, data, tenantId = null) {
    const where = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }
    const [count] = await Document.update(data, { where });
    if (count === 0) {
      throw new Error('Document not found');
    }
    return await Document.findOne({ where });
  }

  /**
   * Delete document
   */
  async delete(id, tenantId = null) {
    const where = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }
    const count = await Document.destroy({ where });
    if (count === 0) {
      throw new Error('Document not found');
    }
    return true;
  }

  /**
   * Get document chunks
   */
  async getChunks(documentId, tenantId = null) {
    // Verify document exists and belongs to tenant
    const document = await this.findById(documentId, tenantId);
    if (!document) {
      throw new Error('Document not found');
    }

    return await DocumentChunk.findAll({
      where: { documentId },
      order: [['chunkIndex', 'ASC']],
    });
  }

  /**
   * Count documents by status
   */
  async countByStatus(tenantId, userId = null) {
    const where = { tenantId };
    if (userId) {
      where.userId = userId;
    }

    const counts = await Document.findAll({
      where,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    return counts.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});
  }
}

module.exports = DocumentRepository;

