const express = require("express");
const router = express.Router();

const {
  uploadResume,
  analyzeResume,
  getLatestResumeAnalysis,
  getResumeDocuments,
  getResumeDocumentById,
  deleteResumeDocument,
  analyzeResumeById,
  getResumeAnalysisByResumeId,
} = require("../controllers/resumeController");

const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/multer");

router.post("/upload", protect, upload.single("resume"), uploadResume);
router.post("/analyze", protect, upload.single("resume"), analyzeResume);

router.get("/documents", protect, getResumeDocuments);
router.get("/documents/:resumeId", protect, getResumeDocumentById);
router.delete("/documents/:resumeId", protect, deleteResumeDocument);

router.post("/:resumeId/analyze", protect, analyzeResumeById);
router.get("/:resumeId/analysis", protect, getResumeAnalysisByResumeId);

router.get("/latest-analysis", protect, getLatestResumeAnalysis);

module.exports = router;