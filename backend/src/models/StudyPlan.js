const mongoose = require("mongoose");

const resourceLinkSchema = new mongoose.Schema(
  {
    label: { type: String, default: "" },
    link: { type: String, default: "" },
    platform: { type: String, default: "" },
  },
  { _id: false }
);

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
    theoryLinks: [resourceLinkSchema],
    practiceSet: [practiceProblemSchema],
    completed: { type: Boolean, default: false },
  },
  { _id: true }
);

const dailyMissionSchema = new mongoose.Schema(
  {
    day: { type: Number, default: 1 },
    date: { type: String, default: "" },
    title: { type: String, default: "" },
    focus: { type: String, default: "" },
    estimatedMinutes: { type: Number, default: 0 },
    tasks: [
      {
        title: { type: String, default: "" },
        category: { type: String, default: "dsa" },
        type: { type: String, default: "practice" },
        priority: { type: String, default: "medium" },
        estimated_time: { type: String, default: "30 min" },
        resources: [resourceLinkSchema],
      },
    ],
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

    focusTopic: {
      type: String,
      default: "General DSA",
    },

    description: {
      type: String,
      default: "",
    },

    roadmap: [{ type: String }],

    subTopics: [subTopicSchema],

    dailyMissions: [dailyMissionSchema],

    category: {
      type: String,
      enum: ["dsa", "development", "core", "resume", "system-design", "mixed"],
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

    targetCompany: {
      type: String,
      default: "",
    },

    timelineDays: {
      type: Number,
      default: 7,
    },

    intensity: {
      type: String,
      enum: ["light", "medium", "hard", "extreme"],
      default: "medium",
    },

    progress: {
      type: Number,
      default: 0,
    },

    readinessSnapshot: {
      dsa: { type: Number, default: 0 },
      development: { type: Number, default: 0 },
      core: { type: Number, default: 0 },
      resume: { type: Number, default: 0 },
      interview: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

studyPlanSchema.index({ userId: 1, isActive: 1 });
studyPlanSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("StudyPlan", studyPlanSchema);