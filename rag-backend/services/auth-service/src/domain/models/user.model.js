const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('@rag-platform/database');

class User extends Model { }

User.init({
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
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING
    },
    lastName: {
        type: DataTypes.STRING
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'user'
    },
    emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'email_verified'
    },
    emailVerifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'email_verified_at'
    },
    failedLoginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'failed_login_attempts'
    },
    accountLockedUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'account_locked_until'
    },
    provider: {
        type: DataTypes.ENUM('email', 'google', 'github'),
        defaultValue: 'email'
    },
    providerId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'provider_id'
    },
    lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login_at'
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    indexes: [
        {
            fields: ['email', 'tenant_id'],
            unique: true
        },
        {
            fields: ['provider', 'provider_id']
        }
    ]
});

module.exports = { User };
