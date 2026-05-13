const express = require("express");
const router = express.Router();

const {
  uploadResume,
  analyzeResume,
  getLatestResumeAnalysis,
} = require("../controllers/resumeController");

const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/multer");

router.post("/upload", protect, upload.single("resume"), uploadResume);
router.post("/analyze", protect, upload.single("resume"), analyzeResume);
router.get("/latest-analysis", protect, getLatestResumeAnalysis);

module.exports = router;