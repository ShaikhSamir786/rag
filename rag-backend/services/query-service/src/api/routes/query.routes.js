const express = require('express');
const { QueryController } = require('../controllers/query.controller');

const router = express.Router();
const controller = new QueryController();

router.post('/', controller.ask.bind(controller));

module.exports = router;
