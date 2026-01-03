const express = require('express');
const { AuthController } = require('../controllers/auth.controller');

const router = express.Router();
const controller = new AuthController();

router.post('/login', controller.login.bind(controller));
router.post('/register', controller.register.bind(controller));

module.exports = router;
