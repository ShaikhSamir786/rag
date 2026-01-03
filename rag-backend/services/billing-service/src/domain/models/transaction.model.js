const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('@rag-platform/database');

class Transaction extends Model { }

Transaction.init({
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
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id'
    },
    paymentIntentId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'payment_intent_id',
        references: {
            model: 'payment_intents',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    provider: {
        type: DataTypes.ENUM('stripe', 'paypal', 'razorpay'),
        allowNull: false,
        defaultValue: 'stripe'
    },
    providerTransactionId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        field: 'provider_transaction_id'
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded'),
        allowNull: false,
        defaultValue: 'pending'
    },
    failureReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'failure_reason'
    },
    failureCode: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'failure_code'
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
    modelName: 'Transaction',
    tableName: 'transactions',
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
            fields: ['user_id']
        },
        {
            fields: ['payment_intent_id']
        },
        {
            fields: ['provider_transaction_id'],
            unique: true
        },
        {
            fields: ['status']
        },
        {
            fields: ['provider', 'provider_transaction_id']
        }
    ]
});

module.exports = { Transaction };


