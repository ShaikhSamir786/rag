const jwt = require('jsonwebtoken');
const { redisClient } = require('../../infrastructure/cache/redis-client');
const { logger } = require('@rag-platform/logger');
const { jwt: jwtConfig } = require('../../config');
const { BaseError, ErrorCode } = require('@rag-platform/common');

class TokenService {
    generateAccessToken(payload) {
        return jwt.sign(
            {
                ...payload,
                type: 'access'
            },
            jwtConfig.accessSecret,
            {
                expiresIn: jwtConfig.accessExpiry,
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience
            }
        );
    }

    generateRefreshToken(payload) {
        return jwt.sign(
            {
                ...payload,
                type: 'refresh'
            },
            jwtConfig.refreshSecret,
            {
                expiresIn: jwtConfig.refreshExpiry,
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience
            }
        );
    }

    async verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, jwtConfig.accessSecret, {
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience
            });

            if (decoded.type !== 'access') {
                throw new BaseError(ErrorCode.UNAUTHORIZED, 'Invalid token type', 401);
            }

            // Check blacklist
            const isBlacklisted = await this.isTokenBlacklisted(token);
            if (isBlacklisted) {
                throw new BaseError(ErrorCode.UNAUTHORIZED, 'Token has been revoked', 401);
            }

            return decoded;
        } catch (error) {
            if (error instanceof BaseError) {
                throw error;
            }
            if (error.name === 'TokenExpiredError') {
                throw new BaseError(ErrorCode.UNAUTHORIZED, 'Token has expired', 401);
            }
            if (error.name === 'JsonWebTokenError') {
                throw new BaseError(ErrorCode.UNAUTHORIZED, 'Invalid token', 401);
            }
            throw new BaseError(ErrorCode.INTERNAL_ERROR, 'Token verification failed', 500);
        }
    }

    async verifyRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, jwtConfig.refreshSecret, {
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience
            });

            if (decoded.type !== 'refresh') {
                throw new BaseError(ErrorCode.UNAUTHORIZED, 'Invalid token type', 401);
            }

            // Check blacklist
            const isBlacklisted = await this.isTokenBlacklisted(token);
            if (isBlacklisted) {
                throw new BaseError(ErrorCode.UNAUTHORIZED, 'Token has been revoked', 401);
            }

            return decoded;
        } catch (error) {
            if (error instanceof BaseError) {
                throw error;
            }
            if (error.name === 'TokenExpiredError') {
                throw new BaseError(ErrorCode.UNAUTHORIZED, 'Refresh token has expired', 401);
            }
            if (error.name === 'JsonWebTokenError') {
                throw new BaseError(ErrorCode.UNAUTHORIZED, 'Invalid refresh token', 401);
            }
            throw new BaseError(ErrorCode.INTERNAL_ERROR, 'Token verification failed', 500);
        }
    }

    async blacklistToken(token, expirySeconds = null) {
        try {
            // If no expiry provided, try to decode and use token's expiry
            if (!expirySeconds) {
                try {
                    const decoded = jwt.decode(token);
                    if (decoded && decoded.exp) {
                        const now = Math.floor(Date.now() / 1000);
                        expirySeconds = decoded.exp - now;
                        if (expirySeconds <= 0) {
                            // Token already expired, no need to blacklist
                            return;
                        }
                    }
                } catch (error) {
                    // If we can't decode, use a default expiry (7 days for refresh tokens)
                    expirySeconds = 7 * 24 * 60 * 60;
                }
            }

            const key = `blacklist:token:${token}`;
            await redisClient.set(key, true, expirySeconds);
            logger.info('Token blacklisted');
        } catch (error) {
            logger.error('Failed to blacklist token:', error);
            // Don't throw - blacklisting is best effort
        }
    }

    async isTokenBlacklisted(token) {
        try {
            const key = `blacklist:token:${token}`;
            const exists = await redisClient.exists(key);
            return exists;
        } catch (error) {
            logger.error('Failed to check token blacklist:', error);
            return false; // Fail open - if we can't check, assume not blacklisted
        }
    }

    async refreshTokens(refreshToken) {
        // Verify refresh token
        const decoded = await this.verifyRefreshToken(refreshToken);

        // Blacklist the old refresh token (token rotation)
        await this.blacklistToken(refreshToken);

        // Generate new tokens
        const { id, tenantId, role, email } = decoded;
        const newAccessToken = this.generateAccessToken({ id, tenantId, role, email });
        const newRefreshToken = this.generateRefreshToken({ id, tenantId, role, email });

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        };
    }

    decodeToken(token) {
        return jwt.decode(token);
    }
}

module.exports = { TokenService };

