const express = require('express');
const multer = require('multer');
const { DocumentController } = require('../controllers/document.controller');

const router = express.Router();
const upload = multer();
const controller = new DocumentController();

router.post('/', upload.single('file'), controller.upload.bind(controller));

module.exports = router;
