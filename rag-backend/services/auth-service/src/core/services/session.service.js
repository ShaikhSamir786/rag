const { Session } = require('../../domain/models/session.model');
const { TokenService } = require('./token.service');
const { logger } = require('@rag-platform/logger');
const { jwt: jwtConfig } = require('../../config');
const { BaseError, ErrorCode } = require('@rag-platform/common');
const { Op } = require('sequelize');

class SessionService {
    constructor() {
        this.tokenService = new TokenService();
    }

    async createSession(userId, refreshToken, deviceInfo = {}, ipAddress = null) {
        // Calculate expiry from refresh token
        const decoded = this.tokenService.decodeToken(refreshToken);
        const expiresAt = decoded && decoded.exp 
            ? new Date(decoded.exp * 1000) 
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

        const session = await Session.create({
            userId,
            refreshToken,
            deviceInfo,
            ipAddress,
            expiresAt,
            isRevoked: false
        });

        logger.info(`Session created for user ${userId}`);
        return session;
    }

    async getSessionByRefreshToken(refreshToken) {
        const session = await Session.findOne({
            where: {
                refreshToken,
                isRevoked: false,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        return session;
    }

    async revokeSession(sessionId, userId) {
        const session = await Session.findOne({
            where: {
                id: sessionId,
                userId,
                isRevoked: false
            }
        });

        if (!session) {
            throw new BaseError(ErrorCode.RESOURCE_NOT_FOUND, 'Session not found', 404);
        }

        // Revoke session
        await session.update({ isRevoked: true });

        // Blacklist the refresh token
        await this.tokenService.blacklistToken(session.refreshToken);

        logger.info(`Session ${sessionId} revoked for user ${userId}`);
        return session;
    }

    async revokeAllUserSessions(userId, excludeSessionId = null) {
        const whereClause = {
            userId,
            isRevoked: false
        };

        if (excludeSessionId) {
            whereClause.id = { [Op.ne]: excludeSessionId };
        }

        const sessions = await Session.findAll({ where: whereClause });

        // Blacklist all refresh tokens
        for (const session of sessions) {
            await this.tokenService.blacklistToken(session.refreshToken);
        }

        // Revoke all sessions
        await Session.update(
            { isRevoked: true },
            { where: whereClause }
        );

        logger.info(`All sessions revoked for user ${userId}${excludeSessionId ? ` (excluding ${excludeSessionId})` : ''}`);
        return sessions.length;
    }

    async getUserSessions(userId) {
        const sessions = await Session.findAll({
            where: {
                userId,
                isRevoked: false,
                expiresAt: { [Op.gt]: new Date() }
            },
            order: [['createdAt', 'DESC']]
        });

        return sessions;
    }

    async cleanupExpiredSessions() {
        const deleted = await Session.destroy({
            where: {
                [Op.or]: [
                    { expiresAt: { [Op.lt]: new Date() } },
                    { isRevoked: true, updatedAt: { [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Delete revoked sessions older than 7 days
                ]
            }
        });

        if (deleted > 0) {
            logger.info(`Cleaned up ${deleted} expired sessions`);
        }

        return deleted;
    }

    async validateSession(refreshToken) {
        const session = await this.getSessionByRefreshToken(refreshToken);
        
        if (!session) {
            throw new BaseError(ErrorCode.UNAUTHORIZED, 'Invalid or expired session', 401);
        }

        return session;
    }
}

module.exports = { SessionService };

