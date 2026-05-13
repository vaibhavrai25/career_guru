const mongoose = require("mongoose");

const contestProblemSchema = new mongoose.Schema(
  {
    problemName: { type: String, default: "" },
    problemUrl: { type: String, default: "" },
    difficulty: { type: String, default: "" },
    difficultyRating: { type: Number, default: 0 },
    solved: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { _id: false }
);

const contestHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

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

    contestName: {
      type: String,
      required: true,
      trim: true,
    },

    contestUrl: {
      type: String,
      default: "",
    },

    rank: {
      type: Number,
      default: 0,
    },

    percentile: {
      type: Number,
      default: 0,
    },

    totalParticipants: {
      type: Number,
      default: 0,
    },

    oldRating: {
      type: Number,
      default: 0,
    },

    newRating: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      default: 0,
    },

    ratingDelta: {
      type: Number,
      default: 0,
    },

    problemsSolved: {
      type: Number,
      default: 0,
    },

    totalProblems: {
      type: Number,
      default: 0,
    },

    finishTimeSeconds: {
      type: Number,
      default: 0,
    },

    contestDate: {
      type: Date,
      default: null,
      index: true,
    },

    problems: [contestProblemSchema],

    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

contestHistorySchema.index({
  userId: 1,
  platform: 1,
  contestId: 1,
});

contestHistorySchema.index({
  userId: 1,
  platform: 1,
  contestDate: 1,
});

module.exports = mongoose.model("ContestHistory", contestHistorySchema);