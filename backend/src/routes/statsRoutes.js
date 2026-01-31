const express = require('express');
const router = express.Router();
const { syncCodeforces, syncLeetCode,  getOverviewStats ,getConsistencyStats
    , getDifficultyTrend ,  getTopicStrength, getCodingPersona} = require('../controllers/statsController');

const { protect } = require('../middlewares/authMiddleware');

router.get('/sync', protect, syncCodeforces);
router.get('/sync/leetcode', protect, syncLeetCode);
router.get('/overview', protect, getOverviewStats);
router.get('/consistency', protect, getConsistencyStats);
router.get('/difficulty-trend', protect, getDifficultyTrend);
router.get('/topic-strength', protect, getTopicStrength);
router.get('/coding-persona', protect, getCodingPersona);



module.exports = router;
