const mongoose = require("mongoose");

const studyTaskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    studyPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "StudyPlan", required: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: "StudyTopic", required: true },
    title: { type: String, required: true },
    taskType: { type: String, enum: ["theory", "practice"], default: "practice" },
    problemLink: String, // Link to LeetCode/Codeforces problem
    date: { type: String, required: true }, // "YYYY-MM-DD"
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudyTask", studyTaskSchema);