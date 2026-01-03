'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('otps', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false
            },
            code: {
                type: Sequelize.STRING(6),
                allowNull: false
            },
            type: {
                type: Sequelize.ENUM('VERIFICATION', 'PASSWORD_RESET'),
                allowNull: false,
                defaultValue: 'VERIFICATION'
            },
            expires_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            attempts: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            is_used: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
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
        await queryInterface.addIndex('otps', ['email'], {
            name: 'otps_email_idx'
        });

        await queryInterface.addIndex('otps', ['code'], {
            name: 'otps_code_idx'
        });

        await queryInterface.addIndex('otps', ['expires_at'], {
            name: 'otps_expires_at_idx'
        });

        await queryInterface.addIndex('otps', ['user_id'], {
            name: 'otps_user_id_idx'
        });

        await queryInterface.addIndex('otps', ['email', 'type', 'is_used'], {
            name: 'otps_email_type_is_used_idx'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('otps');
    }
};

