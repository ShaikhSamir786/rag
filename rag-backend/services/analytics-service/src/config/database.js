const { Pool } = require('pg');
const { logger } = require('@rag-platform/logger');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const connectTimescaleDB = async () => {
    try {
        await pool.query('SELECT NOW()');
        logger.info('Analytics Service connected to TimescaleDB (Postgres)');

        // Initialize Hypertable (Idempotent)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS analytics_events (
                id UUID DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                event_type VARCHAR(50) NOT NULL,
                timestamp TIMESTAMPTZ NOT NULL,
                metadata JSONB DEFAULT '{}'
            );
        `);

        // Try creating hypertable, ignore if already exists (error code)
        try {
            await pool.query("SELECT create_hypertable('analytics_events', 'timestamp', if_not_exists => TRUE);");
        } catch (e) {
            // Likely already a hypertable or extension missing, log warning
            logger.warn('Could not create hypertable (ensure TimescaleDB extension is enabled): ' + e.message);
        }

    } catch (error) {
        logger.error('TimescaleDB connection error:', error);
    }
};

module.exports = { pool, connectTimescaleDB };
