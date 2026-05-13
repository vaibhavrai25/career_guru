const mongoose = require("mongoose");

const platformSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    platform: {
      type: String,
      enum: ["leetcode", "codeforces", "codechef", "github", "other"],
      required: true,
      index: true,
    },

    submissionId: {
      type: String,
      default: "",
      index: true,
    },

    problemName: {
      type: String,
      required: true,
      trim: true,
    },

    problemSlug: {
      type: String,
      default: "",
      trim: true,
    },

    problemUrl: {
      type: String,
      default: "",
    },

    contestId: {
      type: String,
      default: "",
    },

    contestName: {
      type: String,
      default: "",
    },

    index: {
      type: String,
      default: "",
    },

    verdict: {
      type: String,
      default: "",
      index: true,
    },

    language: {
      type: String,
      default: "",
    },

    runtime: {
      type: Number,
      default: 0,
    },

    memory: {
      type: Number,
      default: 0,
    },

    difficulty: {
      type: String,
      default: "",
    },

    difficultyRating: {
      type: Number,
      default: 0,
    },

    topic: {
      type: String,
      default: "",
      index: true,
    },

    tags: [{ type: String }],

    submittedAt: {
      type: Date,
      default: null,
      index: true,
    },

    date: {
      type: String,
      required: true,
      index: true,
    },

    isAccepted: {
      type: Boolean,
      default: false,
      index: true,
    },

    isCalendarOnly: {
      type: Boolean,
      default: false,
      index: true,
    },

    source: {
      type: String,
      default: "",
    },

    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

platformSubmissionSchema.index({
  userId: 1,
  platform: 1,
  submissionId: 1,
});

platformSubmissionSchema.index({
  userId: 1,
  platform: 1,
  problemName: 1,
  submittedAt: 1,
});

platformSubmissionSchema.index({
  userId: 1,
  platform: 1,
  date: 1,
});

platformSubmissionSchema.index({
  userId: 1,
  platform: 1,
  isAccepted: 1,
  date: 1,
});

module.exports = mongoose.model("PlatformSubmission", platformSubmissionSchema);