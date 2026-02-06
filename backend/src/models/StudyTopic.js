const mongoose = require("mongoose");

const studyTopicSchema = new mongoose.Schema(
  {
    studyPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyPlan",
      required: true,
    },
    name: {
      type: String, // DSA, OS, DBMS
      required: true,
    },
    totalTasks: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudyTopic", studyTopicSchema);
