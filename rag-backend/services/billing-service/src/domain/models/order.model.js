const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('@rag-platform/database');

class Order extends Model { }

Order.init({
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
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id'
    },
    orderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'order_number'
    },
    idempotencyKey: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'idempotency_key'
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
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
    },
    paymentType: {
        type: DataTypes.ENUM('one_time', 'subscription'),
        allowNull: false,
        defaultValue: 'one_time',
        field: 'payment_type'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    }
}, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['tenant_id']
        },
        {
            fields: ['user_id']
        },
        {
            fields: ['order_number'],
            unique: true
        },
        {
            fields: ['idempotency_key'],
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

module.exports = { Order };

