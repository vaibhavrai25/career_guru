const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");

const {
  analyzeJobDescription,
  generateSkillGap,
  askCareerMentor,
  analyzeGitHubProject,
  generateTopicLearningPath,
  strengthenWeakness,
} = require("../controllers/aiController");

router.post("/job-description/analyze", protect, analyzeJobDescription);
router.post("/skill-gap", protect, generateSkillGap);
router.post("/mentor/ask", protect, askCareerMentor);
router.post("/github/analyze", protect, analyzeGitHubProject);
router.post("/generate-topic", protect, generateTopicLearningPath);
router.post("/strengthen", protect, strengthenWeakness);

module.exports = router;