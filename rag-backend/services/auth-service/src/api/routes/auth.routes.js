const express = require('express');
const { AuthController } = require('../controllers/auth.controller');
const { AuthMiddleware } = require('../middlewares/auth.middleware');
const { rateLimitMiddleware } = require('../middlewares/rate-limit.middleware');
const {
    registerValidator,
    loginValidator,
    verifyEmailValidator,
    resendVerificationValidator,
    changePasswordValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    refreshTokenValidator
} = require('../validators/auth.validator');

const router = express.Router();
const controller = new AuthController();
const authMiddleware = new AuthMiddleware();

// Public routes
router.post(
    '/register',
    rateLimitMiddleware.registerRateLimit,
    registerValidator,
    controller.register.bind(controller)
);

router.post(
    '/login',
    rateLimitMiddleware.loginRateLimit,
    loginValidator,
    controller.login.bind(controller)
);

router.post(
    '/refresh',
    refreshTokenValidator,
    controller.refresh.bind(controller)
);

router.post(
    '/verify-email',
    rateLimitMiddleware.otpRateLimit,
    verifyEmailValidator,
    controller.verifyEmail.bind(controller)
);

router.post(
    '/resend-verification',
    rateLimitMiddleware.otpRateLimit,
    resendVerificationValidator,
    controller.resendVerification.bind(controller)
);

router.post(
    '/forgot-password',
    rateLimitMiddleware.passwordResetRateLimit,
    forgotPasswordValidator,
    controller.forgotPassword.bind(controller)
);

router.post(
    '/reset-password',
    rateLimitMiddleware.passwordResetRateLimit,
    resetPasswordValidator,
    controller.resetPassword.bind(controller)
);

// OAuth routes
router.get('/google', controller.googleOAuth.bind(controller));
router.get('/google/callback', controller.googleCallback.bind(controller));
router.get('/github', controller.githubOAuth.bind(controller));
router.get('/github/callback', controller.githubCallback.bind(controller));

// Protected routes
router.post(
    '/logout',
    authMiddleware.authenticate,
    controller.logout.bind(controller)
);

router.post(
    '/change-password',
    authMiddleware.authenticate,
    changePasswordValidator,
    controller.changePassword.bind(controller)
);

router.get(
    '/sessions',
    authMiddleware.authenticate,
    controller.getSessions.bind(controller)
);

router.delete(
    '/sessions/:sessionId',
    authMiddleware.authenticate,
    controller.revokeSession.bind(controller)
);

router.delete(
    '/sessions',
    authMiddleware.authenticate,
    controller.revokeAllSessions.bind(controller)
);

module.exports = router;
