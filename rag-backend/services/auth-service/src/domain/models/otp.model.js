const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('@rag-platform/database');

class OTP extends Model { }

OTP.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    code: {
        type: DataTypes.STRING(6),
        allowNull: false,
        validate: {
            len: [6, 6],
            isNumeric: true
        }
    },
    type: {
        type: DataTypes.ENUM('VERIFICATION', 'PASSWORD_RESET'),
        allowNull: false,
        defaultValue: 'VERIFICATION'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expires_at'
    },
    attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_used'
    }
}, {
    sequelize,
    modelName: 'OTP',
    tableName: 'otps',
    timestamps: true,
    indexes: [
        {
            fields: ['email']
        },
        {
            fields: ['code']
        },
        {
            fields: ['expires_at']
        },
        {
            fields: ['user_id']
        },
        {
            fields: ['email', 'type', 'is_used']
        }
    ]
});

module.exports = { OTP };

