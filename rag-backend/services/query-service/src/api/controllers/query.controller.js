const { QueryService } = require('../../core/services/query.service');

const queryService = new QueryService();

class QueryController {
    async ask(req, res, next) {
        try {
            const { question } = req.body;
            const tenantId = req.headers['x-tenant-id'];
            const userId = req.headers['x-user-id'];

            const result = await queryService.query(question, userId, tenantId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = { QueryController };
