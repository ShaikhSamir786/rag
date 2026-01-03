const { User } = require('../../domain/models/user.model');
const { OAuthAccount } = require('../../domain/models/oauth-account.model');
const { GoogleOAuthProvider } = require('../../infrastructure/external/oauth/google.provider');
const { GitHubOAuthProvider } = require('../../infrastructure/external/oauth/github.provider');
const { TokenService } = require('./token.service');
const { SessionService } = require('./session.service');
const { logger } = require('@rag-platform/logger');
const { BaseError, ErrorCode } = require('@rag-platform/common');
const { Op } = require('sequelize');

class OAuthService {
    constructor() {
        this.googleProvider = new GoogleOAuthProvider();
        this.githubProvider = new GitHubOAuthProvider();
        this.tokenService = new TokenService();
        this.sessionService = new SessionService();
    }

    getProvider(providerName) {
        switch (providerName.toLowerCase()) {
            case 'google':
                return this.googleProvider;
            case 'github':
                return this.githubProvider;
            default:
                throw new BaseError(ErrorCode.VALIDATION_ERROR, `Unsupported OAuth provider: ${providerName}`, 400);
        }
    }

    async handleOAuthCallback(providerName, code, state, tenantId) {
        const provider = this.getProvider(providerName);

        // Exchange code for token
        const tokenData = await provider.exchangeCodeForToken(code);

        // Get user info from provider
        const userInfo = await provider.getUserInfo(tokenData.accessToken);

        // Check if OAuth account exists
        let oauthAccount = await OAuthAccount.findOne({
            where: {
                provider: providerName.toLowerCase(),
                providerId: userInfo.providerId
            }
        });

        let user;

        if (oauthAccount) {
            // Existing OAuth account - get user
            user = await User.findByPk(oauthAccount.userId);
            if (!user) {
                throw new BaseError(ErrorCode.RESOURCE_NOT_FOUND, 'User not found for OAuth account', 404);
            }

            // Update OAuth account tokens
            await oauthAccount.update({
                accessToken: tokenData.accessToken,
                refreshToken: tokenData.refreshToken || null,
                expiresAt: tokenData.expiresIn 
                    ? new Date(Date.now() + tokenData.expiresIn * 1000) 
                    : null
            });
        } else {
            // New OAuth account - check if user exists by email
            user = await User.findOne({
                where: {
                    email: userInfo.email,
                    tenantId
                }
            });

            if (user) {
                // User exists - link OAuth account
                oauthAccount = await OAuthAccount.create({
                    userId: user.id,
                    provider: providerName.toLowerCase(),
                    providerId: userInfo.providerId,
                    email: userInfo.email,
                    accessToken: tokenData.accessToken,
                    refreshToken: tokenData.refreshToken || null,
                    expiresAt: tokenData.expiresIn 
                        ? new Date(Date.now() + tokenData.expiresIn * 1000) 
                        : null
                });

                // Update user provider info if not set
                if (!user.provider || user.provider === 'email') {
                    await user.update({
                        provider: providerName.toLowerCase(),
                        providerId: userInfo.providerId
                    });
                }

                logger.info(`OAuth account linked for existing user ${user.id}`);
            } else {
                // New user - create account
                user = await User.create({
                    tenantId,
                    email: userInfo.email,
                    firstName: userInfo.firstName,
                    lastName: userInfo.lastName,
                    password: null, // OAuth users don't have passwords
                    provider: providerName.toLowerCase(),
                    providerId: userInfo.providerId,
                    emailVerified: userInfo.verified || false,
                    emailVerifiedAt: userInfo.verified ? new Date() : null,
                    role: 'user'
                });

                // Create OAuth account
                oauthAccount = await OAuthAccount.create({
                    userId: user.id,
                    provider: providerName.toLowerCase(),
                    providerId: userInfo.providerId,
                    email: userInfo.email,
                    accessToken: tokenData.accessToken,
                    refreshToken: tokenData.refreshToken || null,
                    expiresAt: tokenData.expiresIn 
                        ? new Date(Date.now() + tokenData.expiresIn * 1000) 
                        : null
                });

                logger.info(`New user created via OAuth: ${user.id}`);
            }
        }

        // Generate tokens
        const accessToken = this.tokenService.generateAccessToken({
            id: user.id,
            tenantId: user.tenantId,
            role: user.role,
            email: user.email
        });

        const refreshToken = this.tokenService.generateRefreshToken({
            id: user.id,
            tenantId: user.tenantId,
            role: user.role,
            email: user.email
        });

        // Create session
        await this.sessionService.createSession(
            user.id,
            refreshToken,
            { provider: providerName.toLowerCase() },
            null // IP address would come from request
        );

        // Update last login
        await user.update({ lastLoginAt: new Date() });

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                emailVerified: user.emailVerified,
                provider: user.provider
            },
            accessToken,
            refreshToken
        };
    }

    async getAuthorizationURL(providerName, state) {
        const provider = this.getProvider(providerName);
        return provider.getAuthorizationURL(state);
    }
}

module.exports = { OAuthService };

