const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { protect } = require("../middlewares/authMiddleware");

const {
  analyzeJobDescription,
  generateSkillGap,
  askCareerMentor,
  analyzeGitHubProject,
  generateTopicLearningPath,
  strengthenWeakness,
} = require("../controllers/aiController");

// Strict Rate Limiting for AI Routes to prevent API Credit Exhaustion
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 25, // Limit each IP to 25 AI generation requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "AI generation quota exceeded. Please try again in an hour." }
});

router.post("/job-description/analyze", protect, aiLimiter, analyzeJobDescription);
router.post("/skill-gap", protect, aiLimiter, generateSkillGap);
router.post("/mentor/ask", protect, aiLimiter, askCareerMentor);
router.post("/github/analyze", protect, aiLimiter, analyzeGitHubProject);
router.post("/generate-topic", protect, aiLimiter, generateTopicLearningPath);
router.post("/strengthen", protect, aiLimiter, strengthenWeakness);

module.exports = router;