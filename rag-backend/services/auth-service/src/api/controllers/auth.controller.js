const { AuthService } = require('../../core/services/auth.service');
const { OAuthService } = require('../../core/services/oauth.service');
const { PasswordService } = require('../../core/services/password.service');
const { SessionService } = require('../../core/services/session.service');

const authService = new AuthService();
const oauthService = new OAuthService();
const passwordService = new PasswordService();
const sessionService = new SessionService();

class AuthController {
    async register(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const result = await authService.register(req.body, tenantId);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const deviceInfo = {
                userAgent: req.headers['user-agent'],
                platform: req.headers['sec-ch-ua-platform']
            };
            const ipAddress = req.ip || req.connection.remoteAddress;
            
            const result = await authService.login(
                req.body.email,
                req.body.password,
                tenantId,
                deviceInfo,
                ipAddress
            );
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token is required' });
            }

            await authService.logout(refreshToken, req.user.id);
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            next(error);
        }
    }

    async refresh(req, res, next) {
        try {
            const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token is required' });
            }

            const tokens = await authService.refreshTokens(refreshToken);
            res.json(tokens);
        } catch (error) {
            next(error);
        }
    }

    async verifyEmail(req, res, next) {
        try {
            const result = await authService.verifyEmail(req.body.email, req.body.code);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async resendVerification(req, res, next) {
        try {
            const result = await authService.resendVerification(req.body.email);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req, res, next) {
        try {
            const user = await passwordService.changePassword(
                req.user.id,
                req.body.oldPassword,
                req.body.newPassword
            );
            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            next(error);
        }
    }

    async forgotPassword(req, res, next) {
        try {
            const result = await passwordService.requestPasswordReset(req.body.email);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req, res, next) {
        try {
            const user = await passwordService.resetPassword(
                req.body.email,
                req.body.code,
                req.body.newPassword
            );
            res.json({ message: 'Password reset successfully' });
        } catch (error) {
            next(error);
        }
    }

    async googleOAuth(req, res, next) {
        try {
            const googleProvider = oauthService.getProvider('google');
            const state = req.query.state || googleProvider.generateState();
            const url = await oauthService.getAuthorizationURL('google', state);
            
            // Store state in session or cookie for validation
            if (req.session) {
                req.session.oauthState = state;
            } else {
                res.cookie('oauth_state', state, { httpOnly: true, maxAge: 600000 }); // 10 minutes
            }
            
            res.redirect(url);
        } catch (error) {
            next(error);
        }
    }

    async googleCallback(req, res, next) {
        try {
            const { code, state } = req.query;
            const tenantId = req.headers['x-tenant-id'] || req.query.tenant_id;

            // Validate state
            const storedState = req.session?.oauthState || req.cookies?.oauth_state;
            if (!state || state !== storedState) {
                return res.status(400).json({ error: 'Invalid state parameter' });
            }

            const result = await oauthService.handleOAuthCallback('google', code, state, tenantId);
            
            // Redirect to frontend with tokens (in production, use secure httpOnly cookies)
            const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
            redirectUrl.searchParams.set('accessToken', result.accessToken);
            redirectUrl.searchParams.set('refreshToken', result.refreshToken);
            
            res.redirect(redirectUrl.toString());
        } catch (error) {
            next(error);
        }
    }

    async githubOAuth(req, res, next) {
        try {
            const githubProvider = oauthService.getProvider('github');
            const state = req.query.state || githubProvider.generateState();
            const url = await oauthService.getAuthorizationURL('github', state);
            
            // Store state in session or cookie for validation
            if (req.session) {
                req.session.oauthState = state;
            } else {
                res.cookie('oauth_state', state, { httpOnly: true, maxAge: 600000 }); // 10 minutes
            }
            
            res.redirect(url);
        } catch (error) {
            next(error);
        }
    }

    async githubCallback(req, res, next) {
        try {
            const { code, state } = req.query;
            const tenantId = req.headers['x-tenant-id'] || req.query.tenant_id;

            // Validate state
            const storedState = req.session?.oauthState || req.cookies?.oauth_state;
            if (!state || state !== storedState) {
                return res.status(400).json({ error: 'Invalid state parameter' });
            }

            const result = await oauthService.handleOAuthCallback('github', code, state, tenantId);
            
            // Redirect to frontend with tokens (in production, use secure httpOnly cookies)
            const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
            redirectUrl.searchParams.set('accessToken', result.accessToken);
            redirectUrl.searchParams.set('refreshToken', result.refreshToken);
            
            res.redirect(redirectUrl.toString());
        } catch (error) {
            next(error);
        }
    }

    async getSessions(req, res, next) {
        try {
            const sessions = await sessionService.getUserSessions(req.user.id);
            res.json({ sessions });
        } catch (error) {
            next(error);
        }
    }

    async revokeSession(req, res, next) {
        try {
            await sessionService.revokeSession(req.params.sessionId, req.user.id);
            res.json({ message: 'Session revoked successfully' });
        } catch (error) {
            next(error);
        }
    }

    async revokeAllSessions(req, res, next) {
        try {
            const count = await sessionService.revokeAllUserSessions(req.user.id);
            res.json({ message: `All sessions revoked (${count} sessions)` });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = { AuthController };
