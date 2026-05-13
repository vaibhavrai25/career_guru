const mongoose = require("mongoose");

const practiceProblemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    link: { type: String, default: "" },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "easy", "medium", "hard"],
      default: "Medium",
    },
    platform: { type: String, default: "LeetCode" },
    completed: { type: Boolean, default: false },
  },
  { _id: true }
);

const subTopicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    gfgLink: { type: String, default: "" },
    theoryLinks: [
      {
        label: { type: String, default: "" },
        link: { type: String, default: "" },
      },
    ],
    practiceSet: [practiceProblemSchema],
    completed: { type: Boolean, default: false },
  },
  { _id: true }
);

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    focusTopic: { type: String, default: "General DSA" },
    description: { type: String, default: "" },

    roadmap: [{ type: String }],

    subTopics: [subTopicSchema],

    category: {
      type: String,
      enum: ["dsa", "development", "core", "mixed"],
      default: "dsa",
    },

    difficultyLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },

    targetRole: {
      type: String,
      default: "SDE Intern",
    },

    progress: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

studyPlanSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model("StudyPlan", studyPlanSchema);