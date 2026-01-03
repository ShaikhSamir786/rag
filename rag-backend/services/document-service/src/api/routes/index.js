const express = require('express');
const documentRoutes = require('./document.routes');
const folderRoutes = require('./folder.routes');
const shareRoutes = require('./share.routes');

const router = express.Router();

router.use('/documents', documentRoutes);
router.use('/folders', folderRoutes);
router.use('/shares', shareRoutes);

module.exports = router;

