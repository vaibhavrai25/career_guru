const express = require("express");
const router = express.Router();

const {
  upsertProfile,
  getProfile,
  validateHandle,
  getPublicProfileData,
} = require("../controllers/ProfileController");

const { protect } = require("../middlewares/authMiddleware");

// Private profile routes
router.post("/", protect, upsertProfile);
router.get("/", protect, getProfile);
router.get("/validate", protect, validateHandle);

// Public profile route
router.get("/u/:username", getPublicProfileData);

module.exports = router;