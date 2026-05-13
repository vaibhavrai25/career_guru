const mongoose = require("mongoose");

const studyTopicSchema = new mongoose.Schema(
  {
    studyPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyPlan",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["dsa", "development", "core"],
      default: "dsa",
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