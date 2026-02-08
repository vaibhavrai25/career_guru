const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, unique: true, sparse: true }, 
    name: { type: String, default: "" },
    bio: { type: String, default: "" }, // Ensure this is here
    avatar: { type: String, default: "" },
    skills: [String],
    leetcodeHandle: { type: String, default: "" },
    codeforcesHandle: { type: String, default: "" },
    githubHandle: { type: String, default: "" },
    codechefHandle: { type: String, default: "" }, // Check this
    linkedinUrl: String,
    resumeUrl: String,
    isPublic: { type: Boolean, default: false }, // Check this
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);