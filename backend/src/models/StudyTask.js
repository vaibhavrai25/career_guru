const mongoose = require("mongoose");

const studyTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    studyPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyPlan",
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyTopic",
    },
    title: {
      type: String,
      required: true,
    },
    date: {
      type: String, // "2026-02-06"
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudyTask", studyTaskSchema);
