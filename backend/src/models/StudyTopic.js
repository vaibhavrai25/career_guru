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
      enum: ["dsa", "development", "core", "resume", "system-design", "mixed"],
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

    masteryScore: {
      type: Number,
      default: 0,
    },

    weaknessReason: {
      type: String,
      default: "",
    },

    lastPracticedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

studyTopicSchema.index({ userId: 1, category: 1 });
studyTopicSchema.index({ studyPlanId: 1, name: 1 });

module.exports = mongoose.model("StudyTopic", studyTopicSchema);