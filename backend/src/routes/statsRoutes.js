const express = require('express');
const router = express.Router();
const { syncCodeforces } = require('../controllers/statsController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/sync', protect, syncCodeforces);

module.exports = router;
