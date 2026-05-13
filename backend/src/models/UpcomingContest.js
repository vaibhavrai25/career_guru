const mongoose = require("mongoose");

const upcomingContestSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ["leetcode", "codeforces", "codechef", "other"],
      required: true,
      index: true,
    },

    contestId: {
      type: String,
      default: "",
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      default: "",
    },

    startTime: {
      type: Date,
      required: true,
      index: true,
    },

    endTime: {
      type: Date,
      default: null,
    },

    durationSeconds: {
      type: Number,
      default: 0,
    },

    phase: {
      type: String,
      default: "BEFORE",
    },

    type: {
      type: String,
      default: "",
    },

    difficultyHint: {
      type: String,
      default: "",
    },

    isFallback: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

upcomingContestSchema.index({
  platform: 1,
  contestId: 1,
});

upcomingContestSchema.index({
  platform: 1,
  startTime: 1,
});

module.exports = mongoose.model("UpcomingContest", upcomingContestSchema);