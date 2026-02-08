const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  source: String,
  link: String,
});

const studyPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    focusTopic: { type: String, default: "General DSA" },
    reason: String, // AI explanation: "Low accuracy in DP detected"
    description: String,
    difficultyLevel: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    theoryResources: [resourceSchema],
    practiceResources: [resourceSchema],
    roadmap: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudyPlan", studyPlanSchema);