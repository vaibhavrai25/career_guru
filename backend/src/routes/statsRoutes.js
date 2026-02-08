const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
  syncCodeforces, 
  syncLeetCode, 
  syncCodechef, // Placeholder for CodeChef logic
  getOverviewStats, 
  getConsistencyStats, 
  getTopicStrength, 
  getHeatmapDates,
  getDashboardSummary,
  buildSolvedHistory
} = require('../controllers/statsController');

// Syncing Platforms
router.get('/sync/codeforces', protect, syncCodeforces);
router.get('/sync/leetcode', protect, syncLeetCode);
router.get('/sync/codechef', protect, syncCodechef); // Added CodeChef Sync

// Analytics Endpoints
router.get('/overview', protect, getOverviewStats);
router.get('/consistency', protect, getConsistencyStats);
router.get('/topic-strength', protect, getTopicStrength);
router.get('/heatmap-dates', protect, getHeatmapDates);
router.get('/summary', protect, getDashboardSummary);
router.get('/build-history', protect, buildSolvedHistory);

module.exports = router;