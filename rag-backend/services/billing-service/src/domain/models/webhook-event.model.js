const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('@rag-platform/database');

class WebhookEvent extends Model { }

WebhookEvent.init({
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
    provider: {
        type: DataTypes.ENUM('stripe', 'paypal', 'razorpay'),
        allowNull: false,
        defaultValue: 'stripe'
    },
    eventId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'event_id'
    },
    eventType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'event_type'
    },
    payload: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    processed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    processingError: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'processing_error'
    },
    processedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'processed_at'
    }
}, {
    sequelize,
    modelName: 'WebhookEvent',
    tableName: 'webhook_events',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['tenant_id']
        },
        {
            fields: ['event_id'],
            unique: true
        },
        {
            fields: ['event_type']
        },
        {
            fields: ['processed']
        },
        {
            fields: ['provider', 'event_id'],
            unique: true
        },
        {
            fields: ['created_at']
        }
    ]
});

module.exports = { WebhookEvent };



