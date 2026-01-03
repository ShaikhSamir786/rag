class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async findById(id, tenantId) {
        // In a real multi-tenant setup, you might pass the tenant connection or ensure scope
        return this.model.findOne({ where: { id, tenantId } });
    }

    async create(data, tenantId) {
        return this.model.create({ ...data, tenantId });
    }

    async update(id, data, tenantId) {
        const record = await this.findById(id, tenantId);
        if (!record) return null;
        return record.update(data);
    }

    async delete(id, tenantId) {
        return this.model.destroy({ where: { id, tenantId } });
    }

    async findAll(tenantId, options = {}) {
        return this.model.findAll({
            where: { tenantId, ...options.where },
            ...options
        });
    }
}

module.exports = { BaseRepository };
