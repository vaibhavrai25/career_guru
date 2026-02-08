const express = require('express');
const router = express.Router();
const { fetchCodingStats } = require('../controllers/codingController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/fetch', protect, fetchCodingStats);

module.exports = router;