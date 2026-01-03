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
    mimetype: {
        type: DataTypes.STRING,
        allowNull: true
    },
    size: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    chunkCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    embeddingStatus: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        allowNull: true,
        defaultValue: 'pending'
    },
    extractedText: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true
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

// Associations
Document.associate = (models) => {
    Document.hasMany(models.DocumentChunk, {
        foreignKey: 'documentId',
        as: 'chunks',
        onDelete: 'CASCADE',
    });
};

module.exports = { Document };
