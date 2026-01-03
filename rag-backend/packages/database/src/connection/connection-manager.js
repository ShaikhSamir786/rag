const { Sequelize } = require('sequelize');
const { config } = require('../config/database.config');

class ConnectionManager {
  constructor() {
    this.connections = new Map();
  }

  static getInstance() {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  async getConnection(tenantId) {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!this.connections.has(tenantId)) {
      const tenantConfig = {
        ...config,
        database: `tenant_${tenantId}`, // Database per tenant approach
        pool: {
          max: 5,
          min: 0,
          idle: 10000
        }
      };

      const connection = new Sequelize(tenantConfig);
      await connection.authenticate();
      this.connections.set(tenantId, connection);
    }

    return this.connections.get(tenantId);
  }
}

module.exports = { ConnectionManager };
