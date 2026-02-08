const mongoose = require("mongoose");

const platformSchema = new mongoose.Schema({
  handle: String,
  totalSolved: { type: Number, default: 0 },
  topicWise: { type: Object, default: {} },
  dates: [String], // YYYY-MM-DD
  easy: { type: Number, default: 0 },
  medium: { type: Number, default: 0 },
  hard: { type: Number, default: 0 },
  rating: { type: Number, default: 0 }, // CodeChef/Codeforces star ya rating ke liye
  rank: { type: String, default: "" },   // e.g., "3 Star", "Candidate Master"
  status: { 
    type: String, 
    enum: ['Linked', 'Pending Sync', 'Error'], 
    default: 'Pending Sync' 
  }, // Connection status indicator
});

const codingProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    codeforces: platformSchema,
    leetcode: platformSchema,
    codechef: platformSchema, // Added CodeChef Support
    lastSynced: { type: Date, default: Date.now }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("CodingProfile", codingProfileSchema);