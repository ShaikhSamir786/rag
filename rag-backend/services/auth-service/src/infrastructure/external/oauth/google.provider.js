const axios = require('axios');
const { logger } = require('@rag-platform/logger');
const { oauth } = require('../../../config');
const crypto = require('crypto');

class GoogleOAuthProvider {
    constructor() {
        this.config = oauth.google;
    }

    getAuthorizationURL(state) {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.callbackURL,
            response_type: 'code',
            scope: this.config.scope.join(' '),
            access_type: 'offline',
            prompt: 'consent',
            state: state || this.generateState()
        });

        return `${this.config.authorizationURL}?${params.toString()}`;
    }

    async exchangeCodeForToken(code) {
        try {
            const response = await axios.post(
                this.config.tokenURL,
                {
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: this.config.callbackURL
                },
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            return {
                accessToken: response.data.access_token,
                refreshToken: response.data.refresh_token,
                expiresIn: response.data.expires_in,
                tokenType: response.data.token_type
            };
        } catch (error) {
            logger.error('Google OAuth token exchange failed:', error.response?.data || error.message);
            throw new Error('Failed to exchange authorization code for token');
        }
    }

    async getUserInfo(accessToken) {
        try {
            const response = await axios.get(this.config.userInfoURL, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            return {
                providerId: response.data.id,
                email: response.data.email,
                firstName: response.data.given_name,
                lastName: response.data.family_name,
                picture: response.data.picture,
                verified: response.data.verified_email || false
            };
        } catch (error) {
            logger.error('Google OAuth user info fetch failed:', error.response?.data || error.message);
            throw new Error('Failed to fetch user information from Google');
        }
    }

    generateState() {
        return crypto.randomBytes(32).toString('hex');
    }

    validateState(state, expectedState) {
        return state === expectedState;
    }
}

module.exports = { GoogleOAuthProvider };

