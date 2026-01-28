const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    education: String,
    skills: [String],
    interests: [String],
    targetRole: String,
    resumeUrl: String,
    resumeText: String,
    codeforcesHandle: { type: String },
leetcodeHandle: { type: String },
githubHandle: { type: String },
codechefHandle: { type: String },

  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
