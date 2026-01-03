const PDFDocument = require('pdfkit');
const { logger } = require('@rag-platform/logger');

class InvoiceGenerator {
    constructor() {
        this.logger = logger;
    }

    /**
     * Generate PDF invoice
     */
    async generateInvoice(invoiceData) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const chunks = [];

                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // Header
                this.addHeader(doc, invoiceData);

                // Invoice details
                this.addInvoiceDetails(doc, invoiceData);

                // Items table
                this.addItemsTable(doc, invoiceData);

                // Totals
                this.addTotals(doc, invoiceData);

                // Footer
                this.addFooter(doc, invoiceData);

                doc.end();
            } catch (error) {
                this.logger.error('Failed to generate invoice PDF', {
                    error: error.message,
                    invoiceId: invoiceData.id
                });
                reject(error);
            }
        });
    }

    /**
     * Add header to invoice
     */
    addHeader(doc, invoiceData) {
        // Company/Service name
        doc.fontSize(20)
            .text('INVOICE', 50, 50, { align: 'right' });

        doc.fontSize(10)
            .text(`Invoice #${invoiceData.invoiceNumber}`, 50, 80, { align: 'right' });

        // Billing information
        if (invoiceData.billingInfo) {
            doc.fontSize(12)
                .text('Bill To:', 50, 120)
                .fontSize(10)
                .text(invoiceData.billingInfo.name || '', 50, 140)
                .text(invoiceData.billingInfo.email || '', 50, 155)
                .text(invoiceData.billingInfo.address || '', 50, 170);
        }
    }

    /**
     * Add invoice details
     */
    addInvoiceDetails(doc, invoiceData) {
        const y = 220;
        doc.fontSize(10)
            .text(`Invoice Date: ${this.formatDate(invoiceData.invoiceDate)}`, 50, y)
            .text(`Due Date: ${this.formatDate(invoiceData.dueDate)}`, 50, y + 15)
            .text(`Status: ${invoiceData.status.toUpperCase()}`, 50, y + 30);
    }

    /**
     * Add items table
     */
    addItemsTable(doc, invoiceData) {
        let y = 300;

        // Table header
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text('Description', 50, y)
            .text('Quantity', 300, y)
            .text('Price', 400, y)
            .text('Total', 500, y, { align: 'right' })
            .font('Helvetica');

        // Draw line
        y += 20;
        doc.moveTo(50, y).lineTo(550, y).stroke();

        // Items
        y += 10;
        invoiceData.items.forEach(item => {
            doc.text(item.description || 'Item', 50, y, { width: 240 })
                .text(String(item.quantity || 1), 300, y)
                .text(this.formatCurrency(item.unitPrice || 0, invoiceData.currency), 400, y)
                .text(this.formatCurrency(item.total || item.unitPrice || 0, invoiceData.currency), 500, y, { align: 'right' });
            y += 20;
        });
    }

    /**
     * Add totals
     */
    addTotals(doc, invoiceData) {
        const startY = 450;
        let y = startY;

        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text('Subtotal:', 400, y, { align: 'right' })
            .text(this.formatCurrency(invoiceData.subtotal || invoiceData.amount, invoiceData.currency), 500, y, { align: 'right' })
            .font('Helvetica');

        if (invoiceData.tax && invoiceData.tax > 0) {
            y += 15;
            doc.text('Tax:', 400, y, { align: 'right' })
                .text(this.formatCurrency(invoiceData.tax, invoiceData.currency), 500, y, { align: 'right' });
        }

        if (invoiceData.discount && invoiceData.discount > 0) {
            y += 15;
            doc.text('Discount:', 400, y, { align: 'right' })
                .text(`-${this.formatCurrency(invoiceData.discount, invoiceData.currency)}`, 500, y, { align: 'right' });
        }

        y += 20;
        doc.moveTo(400, y).lineTo(550, y).stroke();

        y += 10;
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('Total:', 400, y, { align: 'right' })
            .text(this.formatCurrency(invoiceData.amount, invoiceData.currency), 500, y, { align: 'right' })
            .font('Helvetica');
    }

    /**
     * Add footer
     */
    addFooter(doc, invoiceData) {
        const y = 700;
        doc.fontSize(8)
            .text('Thank you for your business!', 50, y, { align: 'center' })
            .text(`Generated on ${this.formatDate(new Date())}`, 50, y + 15, { align: 'center' });
    }

    /**
     * Format date
     */
    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Format currency
     */
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    }
}

module.exports = { InvoiceGenerator };



