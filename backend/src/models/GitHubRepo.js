const mongoose = require("mongoose");

const repoQualitySchema = new mongoose.Schema(
  {
    hasReadme: { type: Boolean, default: false },
    hasPackageJson: { type: Boolean, default: false },
    hasEnvExample: { type: Boolean, default: false },
    hasTests: { type: Boolean, default: false },
    hasLicense: { type: Boolean, default: false },
    hasDeployment: { type: Boolean, default: false },
    hasDocker: { type: Boolean, default: false },
    hasCI: { type: Boolean, default: false },
    qualityScore: { type: Number, default: 0 },
  },
  { _id: false }
);

const commitSchema = new mongoose.Schema(
  {
    message: { type: String, default: "" },
    sha: { type: String, default: "" },
    url: { type: String, default: "" },
    date: { type: Date, default: null },
    author: { type: String, default: "" },
  },
  { _id: false }
);

const repoSignalSchema = new mongoose.Schema(
  {
    isFrontend: { type: Boolean, default: false },
    isBackend: { type: Boolean, default: false },
    isFullstack: { type: Boolean, default: false },
    isAI: { type: Boolean, default: false },
    isSystems: { type: Boolean, default: false },
    isData: { type: Boolean, default: false },
  },
  { _id: false }
);

const githubRepoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    githubHandle: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    repoId: {
      type: Number,
      default: 0,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    fullName: {
      type: String,
      default: "",
      index: true,
    },

    description: {
      type: String,
      default: "",
    },

    language: {
      type: String,
      default: "",
      index: true,
    },

    languages: {
      type: Map,
      of: Number,
      default: {},
    },

    topics: [{ type: String }],

    stars: {
      type: Number,
      default: 0,
    },

    forks: {
      type: Number,
      default: 0,
    },

    watchers: {
      type: Number,
      default: 0,
    },

    openIssues: {
      type: Number,
      default: 0,
    },

    size: {
      type: Number,
      default: 0,
    },

    defaultBranch: {
      type: String,
      default: "main",
    },

    url: {
      type: String,
      default: "",
    },

    homepage: {
      type: String,
      default: "",
    },

    cloneUrl: {
      type: String,
      default: "",
    },

    createdAtGithub: {
      type: Date,
      default: null,
    },

    updatedAtGithub: {
      type: Date,
      default: null,
    },

    pushedAtGithub: {
      type: Date,
      default: null,
      index: true,
    },

    recentCommits: [commitSchema],

    quality: {
      type: repoQualitySchema,
      default: () => ({}),
    },

    signals: {
      type: repoSignalSchema,
      default: () => ({}),
    },

    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

githubRepoSchema.index({
  userId: 1,
  fullName: 1,
});

githubRepoSchema.index({
  userId: 1,
  language: 1,
});

githubRepoSchema.index({
  userId: 1,
  pushedAtGithub: -1,
});

module.exports = mongoose.model("GitHubRepo", githubRepoSchema);