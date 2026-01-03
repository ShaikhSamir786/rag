'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Create orders table
        await queryInterface.createTable('orders', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            tenant_id: {
                type: Sequelize.UUID,
                allowNull: false
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false
            },
            order_number: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            idempotency_key: {
                type: Sequelize.STRING,
                allowNull: false,
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
                type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
                allowNull: false,
                defaultValue: 'pending'
            },
            payment_type: {
                type: Sequelize.ENUM('one_time', 'subscription'),
                allowNull: false,
                defaultValue: 'one_time'
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: {}
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

        // Create transactions table
        await queryInterface.createTable('transactions', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            tenant_id: {
                type: Sequelize.UUID,
                allowNull: false
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
            payment_intent_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'payment_intents',
                    key: 'id'
                },
                onDelete: 'SET NULL'
            },
            provider: {
                type: Sequelize.ENUM('stripe', 'paypal', 'razorpay'),
                allowNull: false,
                defaultValue: 'stripe'
            },
            provider_transaction_id: {
                type: Sequelize.STRING,
                allowNull: true,
                unique: true
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            currency: {
                type: Sequelize.STRING(3),
                allowNull: false,
                defaultValue: 'USD'
            },
            status: {
                type: Sequelize.ENUM('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded'),
                allowNull: false,
                defaultValue: 'pending'
            },
            failure_reason: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            failure_code: {
                type: Sequelize.STRING,
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

        // Create payment_intents table
        await queryInterface.createTable('payment_intents', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            tenant_id: {
                type: Sequelize.UUID,
                allowNull: false
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
            provider_payment_intent_id: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            client_secret: {
                type: Sequelize.STRING,
                allowNull: true
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            currency: {
                type: Sequelize.STRING(3),
                allowNull: false,
                defaultValue: 'USD'
            },
            status: {
                type: Sequelize.ENUM('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'succeeded', 'canceled'),
                allowNull: false,
                defaultValue: 'requires_payment_method'
            },
            payment_method_types: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                allowNull: true,
                defaultValue: ['card']
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: {}
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

        // Add indexes for orders
        await queryInterface.addIndex('orders', ['tenant_id'], {
            name: 'orders_tenant_id_idx'
        });
        await queryInterface.addIndex('orders', ['user_id'], {
            name: 'orders_user_id_idx'
        });
        await queryInterface.addIndex('orders', ['order_number'], {
            name: 'orders_order_number_idx',
            unique: true
        });
        await queryInterface.addIndex('orders', ['idempotency_key'], {
            name: 'orders_idempotency_key_idx',
            unique: true
        });
        await queryInterface.addIndex('orders', ['status'], {
            name: 'orders_status_idx'
        });
        await queryInterface.addIndex('orders', ['created_at'], {
            name: 'orders_created_at_idx'
        });

        // Add indexes for transactions
        await queryInterface.addIndex('transactions', ['tenant_id'], {
            name: 'transactions_tenant_id_idx'
        });
        await queryInterface.addIndex('transactions', ['order_id'], {
            name: 'transactions_order_id_idx'
        });
        await queryInterface.addIndex('transactions', ['user_id'], {
            name: 'transactions_user_id_idx'
        });
        await queryInterface.addIndex('transactions', ['payment_intent_id'], {
            name: 'transactions_payment_intent_id_idx'
        });
        await queryInterface.addIndex('transactions', ['provider_transaction_id'], {
            name: 'transactions_provider_transaction_id_idx',
            unique: true
        });
        await queryInterface.addIndex('transactions', ['status'], {
            name: 'transactions_status_idx'
        });
        await queryInterface.addIndex('transactions', ['provider', 'provider_transaction_id'], {
            name: 'transactions_provider_provider_id_idx'
        });

        // Add indexes for payment_intents
        await queryInterface.addIndex('payment_intents', ['tenant_id'], {
            name: 'payment_intents_tenant_id_idx'
        });
        await queryInterface.addIndex('payment_intents', ['order_id'], {
            name: 'payment_intents_order_id_idx'
        });
        await queryInterface.addIndex('payment_intents', ['user_id'], {
            name: 'payment_intents_user_id_idx'
        });
        await queryInterface.addIndex('payment_intents', ['provider_payment_intent_id'], {
            name: 'payment_intents_provider_id_idx',
            unique: true
        });
        await queryInterface.addIndex('payment_intents', ['status'], {
            name: 'payment_intents_status_idx'
        });
    },

    async down(queryInterface, Sequelize) {
        // Drop indexes first
        await queryInterface.removeIndex('payment_intents', 'payment_intents_status_idx');
        await queryInterface.removeIndex('payment_intents', 'payment_intents_provider_id_idx');
        await queryInterface.removeIndex('payment_intents', 'payment_intents_user_id_idx');
        await queryInterface.removeIndex('payment_intents', 'payment_intents_order_id_idx');
        await queryInterface.removeIndex('payment_intents', 'payment_intents_tenant_id_idx');

        await queryInterface.removeIndex('transactions', 'transactions_provider_provider_id_idx');
        await queryInterface.removeIndex('transactions', 'transactions_status_idx');
        await queryInterface.removeIndex('transactions', 'transactions_provider_transaction_id_idx');
        await queryInterface.removeIndex('transactions', 'transactions_payment_intent_id_idx');
        await queryInterface.removeIndex('transactions', 'transactions_user_id_idx');
        await queryInterface.removeIndex('transactions', 'transactions_order_id_idx');
        await queryInterface.removeIndex('transactions', 'transactions_tenant_id_idx');

        await queryInterface.removeIndex('orders', 'orders_created_at_idx');
        await queryInterface.removeIndex('orders', 'orders_status_idx');
        await queryInterface.removeIndex('orders', 'orders_idempotency_key_idx');
        await queryInterface.removeIndex('orders', 'orders_order_number_idx');
        await queryInterface.removeIndex('orders', 'orders_user_id_idx');
        await queryInterface.removeIndex('orders', 'orders_tenant_id_idx');

        // Drop tables in reverse order
        await queryInterface.dropTable('transactions');
        await queryInterface.dropTable('payment_intents');
        await queryInterface.dropTable('orders');
    }
};

