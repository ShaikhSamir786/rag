module.exports = {
    otp: {
        expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
        maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),
        rateLimitPerHour: parseInt(process.env.OTP_RATE_LIMIT_PER_HOUR || '3', 10),
        length: 6
    },
    account: {
        lockDurationMinutes: parseInt(process.env.ACCOUNT_LOCK_DURATION_MINUTES || '15', 10),
        maxFailedLoginAttempts: parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || '5', 10)
    },
    rateLimit: {
        loginWindowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS || '900000', 10), // 15 minutes
        loginMaxAttempts: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5', 10),
        registerWindowMs: parseInt(process.env.RATE_LIMIT_REGISTER_WINDOW_MS || '3600000', 10), // 1 hour
        registerMaxAttempts: parseInt(process.env.RATE_LIMIT_REGISTER_MAX || '3', 10),
        otpWindowMs: parseInt(process.env.RATE_LIMIT_OTP_WINDOW_MS || '3600000', 10), // 1 hour
        otpMaxAttempts: parseInt(process.env.RATE_LIMIT_OTP_MAX || '3', 10),
        passwordResetWindowMs: parseInt(process.env.RATE_LIMIT_PASSWORD_RESET_WINDOW_MS || '3600000', 10), // 1 hour
        passwordResetMaxAttempts: parseInt(process.env.RATE_LIMIT_PASSWORD_RESET_MAX || '3', 10)
    },
    password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        historyCount: 3 // Prevent reuse of last 3 passwords
    }
};

