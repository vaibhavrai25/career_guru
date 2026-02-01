const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ats_score: Number,
  skills_found: [String],
  missing_skills_for_sde: [String],
  experience_level: String,
  suggestions: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
