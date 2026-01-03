const winston = require('winston');

class Logger {
    constructor() {
        if (!Logger.instance) {
            Logger.instance = winston.createLogger({
                level: process.env.LOG_LEVEL || 'info',
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                ),
                transports: [
                    new winston.transports.Console(),
                    new winston.transports.File({ filename: 'error.log', level: 'error' })
                ]
            });
        }
        return Logger.instance;
    }

    static getInstance() {
        if (!Logger.instance) {
            new Logger();
        }
        return Logger.instance;
    }
}

module.exports = { Logger };
