const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('@rag-platform/database');

class OAuthAccount extends Model { }

OAuthAccount.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    provider: {
        type: DataTypes.ENUM('google', 'github'),
        allowNull: false
    },
    providerId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'provider_id'
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    accessToken: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'access_token'
    },
    refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'refresh_token'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'expires_at'
    }
}, {
    sequelize,
    modelName: 'OAuthAccount',
    tableName: 'oauth_accounts',
    timestamps: true,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['provider', 'provider_id'],
            unique: true
        },
        {
            fields: ['email']
        }
    ]
});

module.exports = { OAuthAccount };

