const { logger } = require('@rag-platform/logger');
const { InvoiceRepository } = require('../repositories/invoice.repository');
const { OrderRepository } = require('../repositories/order.repository');
const { TransactionRepository } = require('../repositories/transaction.repository');
const { InvoiceGenerator } = require('../../infrastructure/pdf/invoice-generator');
const { NotFoundError } = require('@rag-platform/common').errors;

class InvoiceService {
    constructor() {
        this.invoiceRepository = new InvoiceRepository();
        this.orderRepository = new OrderRepository();
        this.transactionRepository = new TransactionRepository();
        this.invoiceGenerator = new InvoiceGenerator();
        this.logger = logger;
    }

    /**
     * Generate invoice from order
     */
    async generateInvoiceFromOrder(orderId, tenantId) {
        const order = await this.orderRepository.findById(orderId, tenantId);
        if (!order) {
            throw new NotFoundError('Order not found');
        }

        // Check if invoice already exists
        const existingInvoice = await this.invoiceRepository.model.findOne({
            where: { orderId, tenantId }
        });

        if (existingInvoice) {
            return existingInvoice;
        }

        // Get transaction
        const transactions = await this.transactionRepository.findByOrderId(orderId, tenantId);
        const transaction = transactions.find(t => t.status === 'succeeded') || transactions[0];

        // Generate invoice number
        const invoiceNumber = await this.generateInvoiceNumber();

        // Create invoice
        const invoice = await this.invoiceRepository.create({
            orderId: order.id,
            invoiceNumber,
            amount: order.amount,
            currency: order.currency,
            status: 'pending',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            metadata: {
                orderNumber: order.orderNumber,
                transactionId: transaction?.id
            }
        }, tenantId);

        this.logger.info('Invoice generated from order', {
            invoiceId: invoice.id,
            invoiceNumber,
            orderId
        });

        return invoice;
    }

    /**
     * Get invoice by ID
     */
    async getInvoice(invoiceId, tenantId) {
        const invoice = await this.invoiceRepository.findById(invoiceId, tenantId);
        if (!invoice) {
            throw new NotFoundError('Invoice not found');
        }
        return invoice;
    }

    /**
     * Generate PDF for invoice
     */
    async generateInvoicePDF(invoiceId, tenantId) {
        const invoice = await this.getInvoice(invoiceId, tenantId);
        const order = await this.orderRepository.findById(invoice.orderId, tenantId);

        const invoiceData = {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.createdAt,
            dueDate: invoice.dueDate,
            status: invoice.status,
            amount: invoice.amount,
            currency: invoice.currency,
            items: [
                {
                    description: order.description || 'Payment',
                    quantity: 1,
                    unitPrice: invoice.amount,
                    total: invoice.amount
                }
            ],
            subtotal: invoice.amount,
            billingInfo: invoice.metadata?.billingInfo || {}
        };

        const pdfBuffer = await this.invoiceGenerator.generateInvoice(invoiceData);

        this.logger.info('Invoice PDF generated', {
            invoiceId,
            size: pdfBuffer.length
        });

        return pdfBuffer;
    }

    /**
     * Generate invoice number
     */
    async generateInvoiceNumber() {
        const prefix = 'INV';
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}-${timestamp}-${random}`;
    }

    /**
     * Mark invoice as paid
     */
    async markInvoiceAsPaid(invoiceId, tenantId) {
        const invoice = await this.getInvoice(invoiceId, tenantId);
        return this.invoiceRepository.update(invoiceId, { status: 'paid' }, tenantId);
    }

    /**
     * Get invoices by order
     */
    async getInvoicesByOrder(orderId, tenantId) {
        return this.invoiceRepository.model.findAll({
            where: { orderId, tenantId },
            order: [['created_at', 'DESC']]
        });
    }
}

module.exports = { InvoiceService };


