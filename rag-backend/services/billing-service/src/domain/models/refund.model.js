const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('@rag-platform/database');

class Refund extends Model { }

Refund.init({
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
    transactionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'transaction_id',
        references: {
            model: 'transactions',
            key: 'id'
        },
        onDelete: 'CASCADE'
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
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id'
    },
    provider: {
        type: DataTypes.ENUM('stripe', 'paypal', 'razorpay'),
        allowNull: false,
        defaultValue: 'stripe'
    },
    providerRefundId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        field: 'provider_refund_id'
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
        type: DataTypes.ENUM('pending', 'processing', 'succeeded', 'failed', 'canceled'),
        allowNull: false,
        defaultValue: 'pending'
    },
    reason: {
        type: DataTypes.ENUM('duplicate', 'fraudulent', 'requested_by_customer', 'other'),
        allowNull: true
    },
    reasonDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'reason_description'
    },
    failureReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'failure_reason'
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    processedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'processed_at'
    }
}, {
    sequelize,
    modelName: 'Refund',
    tableName: 'refunds',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['tenant_id']
        },
        {
            fields: ['transaction_id']
        },
        {
            fields: ['order_id']
        },
        {
            fields: ['user_id']
        },
        {
            fields: ['provider_refund_id'],
            unique: true
        },
        {
            fields: ['status']
        },
        {
            fields: ['created_at']
        }
    ]
});

module.exports = { Refund };



