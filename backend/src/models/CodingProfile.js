const mongoose = require("mongoose");

const ratingHistorySchema = new mongoose.Schema(
  {
    rating: { type: Number, default: 0 },
    oldRating: { type: Number, default: 0 },
    newRating: { type: Number, default: 0 },
    ratingDelta: { type: Number, default: 0 },
    rank: { type: String, default: "" },
    contestRank: { type: Number, default: 0 },
    contestName: { type: String, default: "" },
    contestId: { type: String, default: "" },
    date: { type: Date, default: null },
  },
  { _id: false }
);

const upcomingContestSchema = new mongoose.Schema(
  {
    contestId: { type: String, default: "" },
    title: { type: String, default: "" },
    platform: { type: String, default: "" },
    startTime: { type: Date, default: null },
    durationSeconds: { type: Number, default: 0 },
    url: { type: String, default: "" },
    phase: { type: String, default: "" },
    isFallback: { type: Boolean, default: false },
  },
  { _id: false }
);

const ratingPredictionSchema = new mongoose.Schema(
  {
    currentRating: { type: Number, default: 0 },
    predictedNextRating: { type: Number, default: 0 },
    expectedDelta: { type: Number, default: 0 },
    bestCase: { type: Number, default: 0 },
    worstCase: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    reason: { type: String, default: "" },
  },
  { _id: false }
);

const profileMetaSchema = new mongoose.Schema(
  {
    avatar: { type: String, default: "" },
    realName: { type: String, default: "" },
    country: { type: String, default: "" },
    organization: { type: String, default: "" },
    contribution: { type: Number, default: 0 },
    reputation: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    globalRanking: { type: Number, default: 0 },
    registrationTime: { type: Date, default: null },
    lastOnlineTime: { type: Date, default: null },
  },
  { _id: false }
);

const submissionsSummarySchema = new mongoose.Schema(
  {
    totalSubmissions: { type: Number, default: 0 },
    acceptedSubmissions: { type: Number, default: 0 },
    acceptanceRate: { type: Number, default: 0 },
    activeDays: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: "" },
    verdictWise: { type: Map, of: Number, default: {} },
    languageWise: { type: Map, of: Number, default: {} },
    difficultyWise: { type: Map, of: Number, default: {} },
    monthlyActivity: { type: Map, of: Number, default: {} },
    yearlyActivity: { type: Map, of: Number, default: {} },
    limitedData: { type: Boolean, default: false },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const platformSchema = new mongoose.Schema(
  {
    handle: { type: String, default: "" },

    totalSolved: { type: Number, default: 0 },

    topicWise: {
      type: Map,
      of: Number,
      default: {},
    },

    dates: [{ type: String }],

    streak: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
    activeDays: { type: Number, default: 0 },

    ratingHistory: [ratingHistorySchema],
    upcomingContests: [upcomingContestSchema],
    ratingPrediction: {
      type: ratingPredictionSchema,
      default: () => ({}),
    },

    submissionsSummary: {
      type: submissionsSummarySchema,
      default: () => ({}),
    },

    profileMeta: {
      type: profileMetaSchema,
      default: () => ({}),
    },

    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 },

    rating: { type: Number, default: 0 },
    maxRating: { type: Number, default: 0 },

    rank: { type: String, default: "" },
    globalRank: { type: Number, default: 0 },
    countryRank: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["Linked", "Pending Sync", "Error"],
      default: "Pending Sync",
    },

    error: { type: String, default: "" },
    lastSyncedAt: { type: Date, default: null },
  },
  { _id: false }
);

const repoQualitySchema = new mongoose.Schema(
  {
    hasReadme: { type: Boolean, default: false },
    hasPackageJson: { type: Boolean, default: false },
    hasTests: { type: Boolean, default: false },
    hasLicense: { type: Boolean, default: false },
    hasDeployment: { type: Boolean, default: false },
    qualityScore: { type: Number, default: 0 },
  },
  { _id: false }
);

const pinnedRepoSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    fullName: { type: String, default: "" },
    description: { type: String, default: "" },
    language: { type: String, default: "" },
    topics: [{ type: String }],
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    watchers: { type: Number, default: 0 },
    openIssues: { type: Number, default: 0 },
    size: { type: Number, default: 0 },
    url: { type: String, default: "" },
    homepage: { type: String, default: "" },
    createdAt: { type: Date, default: null },
    updatedAt: { type: Date, default: null },
    pushedAt: { type: Date, default: null },
    recentCommits: [{ type: String }],
    languages: { type: Map, of: Number, default: {} },
    quality: {
      type: repoQualitySchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

const githubSchema = new mongoose.Schema(
  {
    handle: { type: String, default: "" },
    name: { type: String, default: "" },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    company: { type: String, default: "" },
    location: { type: String, default: "" },
    blog: { type: String, default: "" },

    totalRepos: { type: Number, default: 0 },
    publicRepos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },

    contributionDates: [{ type: String }],
    activeDays: { type: Number, default: 0 },

    pinnedRepos: [pinnedRepoSchema],

    languageWise: {
      type: Map,
      of: Number,
      default: {},
    },

    projectSignals: {
      backendRepos: { type: Number, default: 0 },
      frontendRepos: { type: Number, default: 0 },
      aiRepos: { type: Number, default: 0 },
      fullstackRepos: { type: Number, default: 0 },
      recentlyActiveRepos: { type: Number, default: 0 },
      documentedRepos: { type: Number, default: 0 },
      productionReadyRepos: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["Linked", "Pending Sync", "Error"],
      default: "Pending Sync",
    },

    error: { type: String, default: "" },
    lastSyncedAt: { type: Date, default: null },
  },
  { _id: false }
);

const codingProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    codeforces: {
      type: platformSchema,
      default: () => ({}),
    },

    leetcode: {
      type: platformSchema,
      default: () => ({}),
    },

    codechef: {
      type: platformSchema,
      default: () => ({}),
    },

    github: {
      type: githubSchema,
      default: () => ({}),
    },

    combined: {
      totalSolved: { type: Number, default: 0 },
      totalActiveDays: { type: Number, default: 0 },
      strongestTopics: [{ type: String }],
      weakestTopics: [{ type: String }],
      readinessScore: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      maxStreak: { type: Number, default: 0 },
      lastComputedAt: { type: Date, default: null },
    },

    lastSynced: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CodingProfile", codingProfileSchema);