const { BaseError } = require('../errors/base.error');
const { ErrorCode } = require('../constants/error-codes');

const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (err instanceof BaseError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message
            }
        });
    }

    // Handle Joi validation errors
    if (err.isJoi) {
        return res.status(400).json({
            success: false,
            error: {
                code: ErrorCode.VALIDATION_ERROR,
                message: 'Validation Error',
                details: err.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            }
        });
    }

    return res.status(500).json({
        success: false,
        error: {
            code: ErrorCode.INTERNAL_ERROR,
            message: 'Internal Server Error'
        }
    });
};

module.exports = { errorHandler };
