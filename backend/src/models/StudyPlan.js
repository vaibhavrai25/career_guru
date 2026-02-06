const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  title: String,
  source: String,
  link: String,
});

const studyPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  focusTopic: String,
  description: String,

  theoryResources: [resourceSchema],
  practiceResources: [resourceSchema],

  roadmap: [String],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("StudyPlan", studyPlanSchema);
