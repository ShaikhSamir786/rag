'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'email_verified', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false
        });

        await queryInterface.addColumn('users', 'email_verified_at', {
            type: Sequelize.DATE,
            allowNull: true
        });

        await queryInterface.addColumn('users', 'failed_login_attempts', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false
        });

        await queryInterface.addColumn('users', 'account_locked_until', {
            type: Sequelize.DATE,
            allowNull: true
        });

        await queryInterface.addColumn('users', 'provider', {
            type: Sequelize.ENUM('email', 'google', 'github'),
            defaultValue: 'email',
            allowNull: false
        });

        await queryInterface.addColumn('users', 'provider_id', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await queryInterface.addColumn('users', 'last_login_at', {
            type: Sequelize.DATE,
            allowNull: true
        });

        // Add indexes
        await queryInterface.addIndex('users', ['provider', 'provider_id'], {
            name: 'users_provider_provider_id_idx'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex('users', 'users_provider_provider_id_idx');
        
        await queryInterface.removeColumn('users', 'last_login_at');
        await queryInterface.removeColumn('users', 'provider_id');
        await queryInterface.removeColumn('users', 'provider');
        await queryInterface.removeColumn('users', 'account_locked_until');
        await queryInterface.removeColumn('users', 'failed_login_attempts');
        await queryInterface.removeColumn('users', 'email_verified_at');
        await queryInterface.removeColumn('users', 'email_verified');
    }
};

