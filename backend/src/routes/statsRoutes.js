const express = require('express');
const router = express.Router();
const { syncCodeforces, syncLeetCode,  getOverviewStats ,getConsistencyStats
    , getDifficultyTrend ,  getTopicStrength, getCodingPersona} = require('../controllers/statsController');

const { protect } = require('../middlewares/authMiddleware');
const { getHeatmapDates } = require('../controllers/statsController');
const { buildSolvedHistory } = require('../controllers/statsController');

router.get('/build-history', protect, buildSolvedHistory);



router.get('/sync', protect, syncCodeforces);
router.get('/sync/leetcode', protect, syncLeetCode);
router.get('/overview', protect, getOverviewStats);
router.get('/consistency', protect, getConsistencyStats);
router.get('/heatmap-dates', protect, getHeatmapDates);
router.get('/difficulty-trend', protect, getDifficultyTrend);
router.get('/topic-strength', protect, getTopicStrength);
router.get('/coding-persona', protect, getCodingPersona);
const { getDashboardSummary } = require('../controllers/statsController');

router.get('/summary', protect, getDashboardSummary);






module.exports = router;
