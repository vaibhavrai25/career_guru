const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    name: {
      type: String,
      default: "",
      trim: true,
    },

    bio: {
      type: String,
      default: "",
    },

    avatar: {
      type: String,
      default: "",
    },

    skills: [{ type: String }],

    leetcodeHandle: {
      type: String,
      default: "",
      trim: true,
    },

    codeforcesHandle: {
      type: String,
      default: "",
      trim: true,
    },

    githubHandle: {
      type: String,
      default: "",
      trim: true,
    },

    codechefHandle: {
      type: String,
      default: "",
      trim: true,
    },

    linkedinUrl: {
      type: String,
      default: "",
      trim: true,
    },

    resumeUrl: {
      type: String,
      default: "",
    },

    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

profileSchema.index({ username: 1 });

module.exports = mongoose.model("Profile", profileSchema);