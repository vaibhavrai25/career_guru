const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { analyzeResume } = require('../controllers/aiController');
const ResumeAnalysis = require('../models/ResumeAnalysis');

router.get('/analyze-resume', protect, analyzeResume);

router.get('/analysis-result', protect, async (req, res) => {
  const data = await ResumeAnalysis.findOne({ userId: req.user._id });
  res.json(data);
});

module.exports = router;
