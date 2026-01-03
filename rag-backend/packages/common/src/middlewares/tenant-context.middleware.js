import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

export const tenantContextMiddleware = (req, res, next) => {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID required' });
        return;
    }

    asyncLocalStorage.run({ tenantId }, () => {
        req.tenantId = tenantId;
        next();
    });
};

export function getContextTenantId() {
    return asyncLocalStorage.getStore()?.tenantId;
}
