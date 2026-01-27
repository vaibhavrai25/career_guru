const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer');
const { uploadResume } = require('../controllers/resumeController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/upload', protect, upload.single('resume'), uploadResume);

module.exports = router;
