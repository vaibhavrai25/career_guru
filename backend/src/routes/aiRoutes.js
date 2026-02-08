const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { analyzeResume } = require('../controllers/aiController');
const ResumeAnalysis = require('../models/ResumeAnalysis');

router.post('/analyze-resume', protect, analyzeResume);

router.get('/analysis-result', protect, async (req, res) => {
  try {
    const data = await ResumeAnalysis.findOne({ userId: req.user._id });
    if (!data) return res.status(404).json({ message: "No analysis found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;