const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('@rag-platform/database');

class Document extends Model { }

Document.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
    s3Key: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending'
    }
}, {
    sequelize,
    modelName: 'Document',
    tableName: 'documents',
    timestamps: true
});

module.exports = { Document };
