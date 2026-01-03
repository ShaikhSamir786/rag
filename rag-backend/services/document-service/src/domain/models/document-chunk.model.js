const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('@rag-platform/database');

class DocumentChunk extends Model { }

DocumentChunk.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    documentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'documents',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    chunkIndex: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tokenCount: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    embeddingId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    }
}, {
    sequelize,
    modelName: 'DocumentChunk',
    tableName: 'document_chunks',
    timestamps: true,
    indexes: [
        {
            fields: ['documentId']
        },
        {
            fields: ['documentId', 'chunkIndex']
        },
        {
            fields: ['embeddingId']
        }
    ]
});

// Associations
DocumentChunk.associate = (models) => {
    DocumentChunk.belongsTo(models.Document, {
        foreignKey: 'documentId',
        as: 'document',
        onDelete: 'CASCADE',
    });
};

module.exports = { DocumentChunk };

