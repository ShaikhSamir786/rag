const { Sequelize } = require('sequelize');

const config = {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'rag_platform',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
};

const sequelize = new Sequelize(config);

module.exports = { sequelize, config };
