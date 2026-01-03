const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');
const {
    createSession,
    updateSession,
    getSession,
    deleteSession,
    getUserSessions,
    validate
} = require('../validators/session.validator');

// Create session
router.post(
    '/sessions',
    createSession,
    validate,
    sessionController.createSession
);

// Get user sessions
router.get(
    '/sessions',
    getUserSessions,
    validate,
    sessionController.getUserSessions
);

// Get single session
router.get(
    '/sessions/:sessionId',
    getSession,
    validate,
    sessionController.getSession
);

// Update session
router.put(
    '/sessions/:sessionId',
    updateSession,
    validate,
    sessionController.updateSession
);

// Archive session
router.post(
    '/sessions/:sessionId/archive',
    getSession,
    validate,
    sessionController.archiveSession
);

// Delete session
router.delete(
    '/sessions/:sessionId',
    deleteSession,
    validate,
    sessionController.deleteSession
);

module.exports = router;
