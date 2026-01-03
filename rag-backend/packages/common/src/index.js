const constants = require('./constants/error-codes');
const errors = require('./errors/base.error');
const middlewares = require('./middlewares/error-handler.middleware');

module.exports = {
    ...constants,
    ...errors,
    ...middlewares
};
