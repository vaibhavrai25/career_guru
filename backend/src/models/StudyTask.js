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

    effortMinutes: {
      type: Number,
      default: 30,
    },

    category: {
      type: String,
      enum: ["dsa", "development", "core", "resume", "system-design", "mixed"],
      default: "dsa",
      index: true,
    },

    type: {
      type: String,
      enum: [
        "article",
        "practice",
        "video",
        "contest",
        "revision",
        "project",
        "theory",
        "implementation",
        "leetcode",
        "codeforces",
        "debugging",
        "mock-interview",
        "project-build",
        "resume-improvement",
        "core-cs",
        "system-design",
        "contest-upsolve",
      ],
      default: "practice",
    },

    source: {
      type: String,
      enum: ["user", "ai", "system"],
      default: "user",
    },

    resources: [resourceSchema],

    date: {
      type: String,
      required: true,
      index: true,
    },

    completed: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: ["todo", "in-progress", "completed", "skipped"],
      default: "todo",
      index: true,
    },

    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },

    subTopic: {
      type: String,
      default: "",
    },

    goal: {
      type: String,
      default: "",
    },

    targetRole: {
      type: String,
      default: "",
    },

    targetCompany: {
      type: String,
      default: "",
    },

    whyThisTask: {
      type: String,
      default: "",
    },

    successCriteria: {
      type: String,
      default: "",
    },

    rescheduleCount: {
      type: Number,
      default: 0,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const parseEffortMinutes = (estimatedTime) => {
  const matches = String(estimatedTime || "").match(/\d+/g);

  if (!matches || matches.length === 0) return 30;

  if (matches.length === 1) return Number(matches[0]);

  const nums = matches.map(Number);
  return Math.round(nums.reduce((sum, value) => sum + value, 0) / nums.length);
};

studyTaskSchema.pre("validate", function () {
  if (this.completed === true && this.status !== "completed") {
    this.status = "completed";
  }

  if (this.status === "completed") {
    this.completed = true;

    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  }

  if (this.status !== "completed") {
    this.completed = false;
    this.completedAt = null;
  }

  if (!this.effortMinutes || this.effortMinutes <= 0) {
    this.effortMinutes = parseEffortMinutes(this.estimated_time);
  }

  if (!this.estimated_time) {
    this.estimated_time = `${this.effortMinutes || 30} min`;
  }
});

studyTaskSchema.index({ userId: 1, date: 1 });
studyTaskSchema.index({ userId: 1, category: 1 });
studyTaskSchema.index({ userId: 1, completed: 1 });
studyTaskSchema.index({ userId: 1, status: 1 });
studyTaskSchema.index({ userId: 1, priority: 1 });

module.exports = mongoose.model("StudyTask", studyTaskSchema);