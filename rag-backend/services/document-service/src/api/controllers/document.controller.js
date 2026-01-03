const { DocumentService } = require('../../core/services/document.service');

const documentService = new DocumentService();

class DocumentController {
    async upload(req, res, next) {
        try {
            const file = req.file;
            const tenantId = req.headers['x-tenant-id'];
            const userId = req.headers['x-user-id']; // Proxied from Gateway

            const result = await documentService.upload(file, userId, tenantId);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = { DocumentController };
