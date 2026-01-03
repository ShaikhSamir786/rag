'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Create refunds table
        await queryInterface.createTable('refunds', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            tenant_id: {
                type: Sequelize.UUID,
                allowNull: false
            },
            transaction_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'transactions',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            order_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'orders',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false
            },
            provider: {
                type: Sequelize.ENUM('stripe', 'paypal', 'razorpay'),
                allowNull: false,
                defaultValue: 'stripe'
            },
            provider_refund_id: {
                type: Sequelize.STRING,
                allowNull: true,
                unique: true
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    min: 0
                }
            },
            currency: {
                type: Sequelize.STRING(3),
                allowNull: false,
                defaultValue: 'USD'
            },
            status: {
                type: Sequelize.ENUM('pending', 'processing', 'succeeded', 'failed', 'canceled'),
                allowNull: false,
                defaultValue: 'pending'
            },
            reason: {
                type: Sequelize.ENUM('duplicate', 'fraudulent', 'requested_by_customer', 'other'),
                allowNull: true
            },
            reason_description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            failure_reason: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: {}
            },
            processed_at: {
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

        // Create webhook_events table
        await queryInterface.createTable('webhook_events', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            tenant_id: {
                type: Sequelize.UUID,
                allowNull: false
            },
            provider: {
                type: Sequelize.ENUM('stripe', 'paypal', 'razorpay'),
                allowNull: false,
                defaultValue: 'stripe'
            },
            event_id: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            event_type: {
                type: Sequelize.STRING,
                allowNull: false
            },
            payload: {
                type: Sequelize.JSONB,
                allowNull: false
            },
            processed: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            processing_error: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            processed_at: {
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

        // Add indexes for refunds
        await queryInterface.addIndex('refunds', ['tenant_id'], {
            name: 'refunds_tenant_id_idx'
        });
        await queryInterface.addIndex('refunds', ['transaction_id'], {
            name: 'refunds_transaction_id_idx'
        });
        await queryInterface.addIndex('refunds', ['order_id'], {
            name: 'refunds_order_id_idx'
        });
        await queryInterface.addIndex('refunds', ['user_id'], {
            name: 'refunds_user_id_idx'
        });
        await queryInterface.addIndex('refunds', ['provider_refund_id'], {
            name: 'refunds_provider_refund_id_idx',
            unique: true
        });
        await queryInterface.addIndex('refunds', ['status'], {
            name: 'refunds_status_idx'
        });
        await queryInterface.addIndex('refunds', ['created_at'], {
            name: 'refunds_created_at_idx'
        });

        // Add indexes for webhook_events
        await queryInterface.addIndex('webhook_events', ['tenant_id'], {
            name: 'webhook_events_tenant_id_idx'
        });
        await queryInterface.addIndex('webhook_events', ['event_id'], {
            name: 'webhook_events_event_id_idx',
            unique: true
        });
        await queryInterface.addIndex('webhook_events', ['event_type'], {
            name: 'webhook_events_event_type_idx'
        });
        await queryInterface.addIndex('webhook_events', ['processed'], {
            name: 'webhook_events_processed_idx'
        });
        await queryInterface.addIndex('webhook_events', ['provider', 'event_id'], {
            name: 'webhook_events_provider_event_id_idx',
            unique: true
        });
        await queryInterface.addIndex('webhook_events', ['created_at'], {
            name: 'webhook_events_created_at_idx'
        });
    },

    async down(queryInterface, Sequelize) {
        // Drop indexes first
        await queryInterface.removeIndex('webhook_events', 'webhook_events_created_at_idx');
        await queryInterface.removeIndex('webhook_events', 'webhook_events_provider_event_id_idx');
        await queryInterface.removeIndex('webhook_events', 'webhook_events_processed_idx');
        await queryInterface.removeIndex('webhook_events', 'webhook_events_event_type_idx');
        await queryInterface.removeIndex('webhook_events', 'webhook_events_event_id_idx');
        await queryInterface.removeIndex('webhook_events', 'webhook_events_tenant_id_idx');

        await queryInterface.removeIndex('refunds', 'refunds_created_at_idx');
        await queryInterface.removeIndex('refunds', 'refunds_status_idx');
        await queryInterface.removeIndex('refunds', 'refunds_provider_refund_id_idx');
        await queryInterface.removeIndex('refunds', 'refunds_user_id_idx');
        await queryInterface.removeIndex('refunds', 'refunds_order_id_idx');
        await queryInterface.removeIndex('refunds', 'refunds_transaction_id_idx');
        await queryInterface.removeIndex('refunds', 'refunds_tenant_id_idx');

        // Drop tables
        await queryInterface.dropTable('webhook_events');
        await queryInterface.dropTable('refunds');
    }
};



