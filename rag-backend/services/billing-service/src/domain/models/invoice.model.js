const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('@rag-platform/database');

class Invoice extends Model { }

Invoice.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'tenant_id'
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'order_id',
        references: {
            model: 'orders',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'invoice_number'
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
    },
    status: {
        type: DataTypes.ENUM('pending', 'paid', 'overdue', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'due_date'
    },
    paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'paid_at'
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    }
}, {
    sequelize,
    modelName: 'Invoice',
    tableName: 'invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['tenant_id']
        },
        {
            fields: ['order_id']
        },
        {
            fields: ['invoice_number'],
            unique: true
        },
        {
            fields: ['status']
        }
    ]
});

module.exports = { Invoice };



