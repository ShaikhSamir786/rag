const { createProxyMiddleware } = require('http-proxy-middleware');
const { logger } = require('@rag-platform/logger');

const setupProxy = (app, routes) => {
    routes.forEach(route => {
        app.use(
            route.url,
            createProxyMiddleware({
                target: route.target,
                changeOrigin: true,
                pathRewrite: route.pathRewrite,
                onProxyReq: (proxyReq, req, res) => {
                    // Forward Tenant ID if present
                    if (req.headers['x-tenant-id']) {
                        proxyReq.setHeader('x-tenant-id', req.headers['x-tenant-id']);
                    }
                },
                onError: (err, req, res) => {
                    logger.error(`Proxy Error: ${err.message}`, { url: req.url, target: route.target });
                    res.status(500).json({ error: 'Proxy Error', message: 'Service unavailable' });
                }
            })
        );
        logger.info(`Proxy setup: ${route.url} -> ${route.target}`);
    });
};

module.exports = { setupProxy };
