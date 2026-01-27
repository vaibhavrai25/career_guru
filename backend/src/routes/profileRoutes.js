const express = require('express');
const router = express.Router();
const { upsertProfile, getProfile } = require('../controllers/ProfileController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, upsertProfile)
  .get(protect, getProfile);

module.exports = router;
