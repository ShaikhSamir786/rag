const axios = require('axios');
const { logger } = require('@rag-platform/logger');
const { oauth } = require('../../../config');
const crypto = require('crypto');

class GitHubOAuthProvider {
    constructor() {
        this.config = oauth.github;
    }

    getAuthorizationURL(state) {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.callbackURL,
            scope: this.config.scope.join(' '),
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
                    code
                },
                {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                accessToken: response.data.access_token,
                tokenType: response.data.token_type,
                scope: response.data.scope
            };
        } catch (error) {
            logger.error('GitHub OAuth token exchange failed:', error.response?.data || error.message);
            throw new Error('Failed to exchange authorization code for token');
        }
    }

    async getUserInfo(accessToken) {
        try {
            // Get user profile
            const userResponse = await axios.get(this.config.userInfoURL, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            });

            // Get user emails
            let email = userResponse.data.email;
            let verified = false;

            if (!email) {
                try {
                    const emailsResponse = await axios.get('https://api.github.com/user/emails', {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            Accept: 'application/vnd.github.v3+json'
                        }
                    });

                    const primaryEmail = emailsResponse.data.find(e => e.primary);
                    email = primaryEmail ? primaryEmail.email : emailsResponse.data[0]?.email;
                    verified = primaryEmail ? primaryEmail.verified : emailsResponse.data[0]?.verified;
                } catch (emailError) {
                    logger.warn('Failed to fetch GitHub user emails:', emailError.message);
                }
            }

            // Parse name
            const nameParts = (userResponse.data.name || '').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            return {
                providerId: userResponse.data.id.toString(),
                email: email || `${userResponse.data.login}@users.noreply.github.com`,
                firstName,
                lastName,
                picture: userResponse.data.avatar_url,
                verified: verified || false,
                username: userResponse.data.login
            };
        } catch (error) {
            logger.error('GitHub OAuth user info fetch failed:', error.response?.data || error.message);
            throw new Error('Failed to fetch user information from GitHub');
        }
    }

    generateState() {
        return crypto.randomBytes(32).toString('hex');
    }

    validateState(state, expectedState) {
        return state === expectedState;
    }
}

module.exports = { GitHubOAuthProvider };

