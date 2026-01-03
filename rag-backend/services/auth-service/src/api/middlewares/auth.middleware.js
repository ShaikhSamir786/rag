const { TokenService } = require('../../core/services/token.service');
const { User } = require('../../domain/models/user.model');
const { BaseError, ErrorCode } = require('@rag-platform/common');

class AuthMiddleware {
    constructor() {
        this.tokenService = new TokenService();
    }

    authenticate = async (req, res, next) => {
        try {
            // Get token from Authorization header
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new BaseError(ErrorCode.UNAUTHORIZED, 'No token provided', 401);
            }

            const token = authHeader.substring(7); // Remove 'Bearer ' prefix

            // Verify token
            const decoded = await this.tokenService.verifyAccessToken(token);

            // Get user from database
            const user = await User.findByPk(decoded.id);
            if (!user) {
                throw new BaseError(ErrorCode.RESOURCE_NOT_FOUND, 'User not found', 404);
            }

            // Attach user to request
            req.user = {
                id: user.id,
                email: user.email,
                tenantId: user.tenantId,
                role: user.role,
                emailVerified: user.emailVerified
            };
            req.token = token;

            next();
        } catch (error) {
            next(error);
        }
    }

    optionalAuth = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    const decoded = await this.tokenService.verifyAccessToken(token);
                    const user = await User.findByPk(decoded.id);
                    if (user) {
                        req.user = {
                            id: user.id,
                            email: user.email,
                            tenantId: user.tenantId,
                            role: user.role,
                            emailVerified: user.emailVerified
                        };
                        req.token = token;
                    }
                } catch (error) {
                    // Ignore auth errors for optional auth
                }
            }
            
            next();
        } catch (error) {
            next(error);
        }
    }

    requireEmailVerified = (req, res, next) => {
        if (!req.user) {
            return next(new BaseError(ErrorCode.UNAUTHORIZED, 'Authentication required', 401));
        }

        if (!req.user.emailVerified) {
            return next(new BaseError(
                ErrorCode.VALIDATION_ERROR,
                'Email verification required',
                403
            ));
        }

        next();
    }

    requireRole = (...roles) => {
        return (req, res, next) => {
            if (!req.user) {
                return next(new BaseError(ErrorCode.UNAUTHORIZED, 'Authentication required', 401));
            }

            if (!roles.includes(req.user.role)) {
                return next(new BaseError(
                    ErrorCode.UNAUTHORIZED,
                    'Insufficient permissions',
                    403
                ));
            }

            next();
        };
    }
}

module.exports = { AuthMiddleware };

