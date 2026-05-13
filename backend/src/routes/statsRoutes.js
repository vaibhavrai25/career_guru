const express = require("express");
const router = express.Router();

const {
  syncLeetCode,
  syncCodeforces,
  syncCodechef,
  syncGitHub,
  syncAllPlatforms,
  getDashboardSummary,
  getGitHubRepos,
  buildSolvedHistory,
} = require("../controllers/statsController");

const {
  getSubmissions,
  getContestHistory,
  getUpcomingContests,
  getDeepGitHubRepos,
  getAnalyticsSnapshots,
} = require("../controllers/statsReadController");

const { protect } = require("../middlewares/authMiddleware");

router.get("/dashboard", protect, getDashboardSummary);

router.get("/sync/all", protect, syncAllPlatforms);
router.get("/sync/leetcode", protect, syncLeetCode);
router.get("/sync/codeforces", protect, syncCodeforces);
router.get("/sync/codechef", protect, syncCodechef);
router.get("/sync/github", protect, syncGitHub);

router.get("/submissions", protect, getSubmissions);

router.get("/contests/history", protect, getContestHistory);
router.get("/contests/upcoming", protect, getUpcomingContests);

router.get("/github/deep-repos", protect, getDeepGitHubRepos);
router.get("/analytics/snapshots", protect, getAnalyticsSnapshots);

router.get("/github/repos", protect, getGitHubRepos);
router.get("/solved-history/build", protect, buildSolvedHistory);

router.get("/github-repos", protect, getGitHubRepos);
router.get("/build-history", protect, buildSolvedHistory);

module.exports = router;