const { AuthService } = require('../../core/services/auth.service');

const authService = new AuthService();

class AuthController {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            // Depending on how tenant is resolved (header or sub-domain), here assuming header middleware sets it or body
            // Actually common middleware sets req.tenantId usually, or we pass it
            const result = await authService.login(email, password, req.headers['x-tenant-id']);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async register(req, res, next) {
        try {
            const result = await authService.register(req.body, req.headers['x-tenant-id']);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = { AuthController };
