const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('@rag-platform/database');

class PaymentIntent extends Model { }

PaymentIntent.init({
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
    provider: {
        type: DataTypes.ENUM('stripe', 'paypal', 'razorpay'),
        allowNull: false,
        defaultValue: 'stripe'
    },
    providerPaymentIntentId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'provider_payment_intent_id'
    },
    clientSecret: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'client_secret'
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
        type: DataTypes.ENUM('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'succeeded', 'canceled'),
        allowNull: false,
        defaultValue: 'requires_payment_method'
    },
    paymentMethodTypes: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: ['card'],
        field: 'payment_method_types'
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'expires_at'
    }
}, {
    sequelize,
    modelName: 'PaymentIntent',
    tableName: 'payment_intents',
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
            fields: ['provider_payment_intent_id'],
            unique: true
        },
        {
            fields: ['status']
        }
    ]
});

module.exports = { PaymentIntent };



