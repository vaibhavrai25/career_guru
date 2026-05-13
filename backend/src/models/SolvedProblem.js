const mongoose = require("mongoose");

const solvedProblemSchema = new mongoose.Schema(
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
      default: "other",
    },

    problemName: {
      type: String,
      required: true,
      trim: true,
    },

    problemUrl: {
      type: String,
      default: "",
    },

    topic: {
      type: String,
      default: "",
    },

    difficulty: {
      type: String,
      default: "",
    },

    date: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

solvedProblemSchema.index(
  { userId: 1, platform: 1, problemName: 1 },
  { unique: false }
);

module.exports = mongoose.model("SolvedProblem", solvedProblemSchema);