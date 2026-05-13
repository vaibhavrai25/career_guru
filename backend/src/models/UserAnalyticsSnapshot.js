const mongoose = require("mongoose");

const platformSnapshotSchema = new mongoose.Schema(
  {
    totalSolved: { type: Number, default: 0 },
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    maxRating: { type: Number, default: 0 },
    rank: { type: String, default: "" },
    activeDays: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    topicWise: { type: Map, of: Number, default: {} },
    status: { type: String, default: "" },
  },
  { _id: false }
);

const githubSnapshotSchema = new mongoose.Schema(
  {
    totalRepos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    activeDays: { type: Number, default: 0 },
    languageWise: { type: Map, of: Number, default: {} },
    projectSignals: {
      backendRepos: { type: Number, default: 0 },
      frontendRepos: { type: Number, default: 0 },
      aiRepos: { type: Number, default: 0 },
      fullstackRepos: { type: Number, default: 0 },
      recentlyActiveRepos: { type: Number, default: 0 },
      documentedRepos: { type: Number, default: 0 },
      productionReadyRepos: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const userAnalyticsSnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    date: {
      type: String,
      required: true,
      index: true,
    },

    totalSolved: {
      type: Number,
      default: 0,
    },

    totalActiveDays: {
      type: Number,
      default: 0,
    },

    readinessScore: {
      type: Number,
      default: 0,
    },

    strongestTopics: [{ type: String }],

    weakestTopics: [{ type: String }],

    leetcode: {
      type: platformSnapshotSchema,
      default: () => ({}),
    },

    codeforces: {
      type: platformSnapshotSchema,
      default: () => ({}),
    },

    codechef: {
      type: platformSnapshotSchema,
      default: () => ({}),
    },

    github: {
      type: githubSnapshotSchema,
      default: () => ({}),
    },

    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

userAnalyticsSnapshotSchema.index({
  userId: 1,
  date: 1,
});

module.exports = mongoose.model(
  "UserAnalyticsSnapshot",
  userAnalyticsSnapshotSchema
);