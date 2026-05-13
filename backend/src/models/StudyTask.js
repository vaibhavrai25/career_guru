const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    label: { type: String, default: "" },
    link: { type: String, default: "" },
    platform: { type: String, default: "" },
  },
  { _id: false }
);

const studyTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    estimated_time: {
      type: String,
      default: "30 min",
    },

    category: {
      type: String,
      enum: ["dsa", "development", "core"],
      default: "dsa",
    },

    type: {
      type: String,
      enum: ["article", "practice", "video", "contest", "revision", "project"],
      default: "practice",
    },

    source: {
      type: String,
      enum: ["user", "ai"],
      default: "user",
    },

    resources: [resourceSchema],

    date: {
      type: String,
      required: true,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
  },
  { timestamps: true }
);

studyTaskSchema.index({ userId: 1, date: 1 });
studyTaskSchema.index({ userId: 1, category: 1 });
studyTaskSchema.index({ userId: 1, completed: 1 });

module.exports = mongoose.model("StudyTask", studyTaskSchema);