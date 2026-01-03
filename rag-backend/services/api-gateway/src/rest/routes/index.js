const { setupProxy } = require('../proxy/proxy.service');

const routes = [
    {
        url: '/api/v1/auth',
        target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
        pathRewrite: {
            '^/api/v1/auth': '/auth',
        },
    },
    {
        url: '/api/v1/documents',
        target: process.env.DOCUMENT_SERVICE_URL || 'http://document-service:3002',
        pathRewrite: {
            '^/api/v1/documents': '/documents',
        },
    },
    {
        url: '/api/v1/billing',
        target: process.env.BILLING_SERVICE_URL || 'http://billing-service:3003',
        pathRewrite: {
            '^/api/v1/billing': '/billing',
        },
    }
];

const setupRestRoutes = (app) => {
    setupProxy(app, routes);
};

module.exports = { setupRestRoutes };
