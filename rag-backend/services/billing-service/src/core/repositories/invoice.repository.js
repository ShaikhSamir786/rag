const { BaseRepository } = require('@rag-platform/database');
const { Invoice } = require('../../domain/models/invoice.model');

class InvoiceRepository extends BaseRepository {
    constructor() {
        super(Invoice);
    }

    /**
     * Find invoice by invoice number
     */
    async findByInvoiceNumber(invoiceNumber, tenantId) {
        return this.model.findOne({
            where: { invoiceNumber, tenantId }
        });
    }

    /**
     * Find invoices by order
     */
    async findByOrderId(orderId, tenantId, options = {}) {
        return this.model.findAll({
            where: { orderId, tenantId },
            order: [['created_at', 'DESC']],
            ...options
        });
    }
}

module.exports = { InvoiceRepository };



