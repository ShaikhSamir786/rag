'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('oauth_accounts', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            provider: {
                type: Sequelize.ENUM('google', 'github'),
                allowNull: false
            },
            provider_id: {
                type: Sequelize.STRING,
                allowNull: false
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false
            },
            access_token: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            refresh_token: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            expires_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Add indexes
        await queryInterface.addIndex('oauth_accounts', ['user_id'], {
            name: 'oauth_accounts_user_id_idx'
        });

        await queryInterface.addIndex('oauth_accounts', ['provider', 'provider_id'], {
            name: 'oauth_accounts_provider_provider_id_idx',
            unique: true
        });

        await queryInterface.addIndex('oauth_accounts', ['email'], {
            name: 'oauth_accounts_email_idx'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('oauth_accounts');
    }
};

