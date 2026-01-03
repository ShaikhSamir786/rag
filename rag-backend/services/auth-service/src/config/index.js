const jwtConfig = require('./jwt');
const oauthConfig = require('./oauth');
const emailConfig = require('./email');
const redisConfig = require('./redis');
const securityConfig = require('./security');

module.exports = {
    jwt: jwtConfig,
    oauth: oauthConfig,
    email: emailConfig,
    redis: redisConfig,
    security: securityConfig,
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    baseURL: process.env.BASE_URL || 'http://localhost:3001'
};

