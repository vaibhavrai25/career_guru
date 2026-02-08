const express = require('express');
const router = express.Router();
const { uploadResume } = require('../controllers/resumeController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/multer');

router.post('/upload', protect, upload.single('resume'), uploadResume);

module.exports = router;