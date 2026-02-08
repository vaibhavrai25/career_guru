const express = require('express');
const router = express.Router();
const { upsertProfile, getProfile, validateHandle } = require('../controllers/ProfileController');
const { getPublicProfileData } = require('../controllers/statsController'); // Stats se import kiya
const { protect } = require('../middlewares/authMiddleware');

// --- Private Routes (Token Required) ---
router.post('/', protect, upsertProfile); 
router.get('/', protect, getProfile); 
router.get('/validate', protect, validateHandle); // Profile.jsx ke "Check" button ke liye

// --- Public Route (No Token Required) ---
router.get('/u/:username', getPublicProfileData); 

module.exports = router;