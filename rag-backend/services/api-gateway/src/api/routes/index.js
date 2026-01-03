const express = require('express');
const { ProxyService } = require('../../core/services/proxy.service');

const router = express.Router();
const proxy = new ProxyService();

// Auth Routes
router.post('/auth/login', async (req, res, next) => {
    try {
        const result = await proxy.forward('auth-service', '/auth/login', {
            method: 'POST',
            data: req.body,
            headers: { 'x-tenant-id': req.headers['x-tenant-id'] }
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/auth/register', async (req, res, next) => {
    try {
        const result = await proxy.forward('auth-service', '/auth/register', {
            method: 'POST',
            data: req.body,
            headers: { 'x-tenant-id': req.headers['x-tenant-id'] }
        });
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
