const mongoose = require("mongoose");

const parsedProfileSchema = new mongoose.Schema(
  {
    candidateName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },

    links: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      leetcode: { type: String, default: "" },
      portfolio: { type: String, default: "" },
      codeforces: { type: String, default: "" },
      codechef: { type: String, default: "" },
      others: [{ type: String }],
    },

    education: [
      {
        institute: { type: String, default: "" },
        degree: { type: String, default: "" },
        branch: { type: String, default: "" },
        duration: { type: String, default: "" },
        score: { type: String, default: "" },
      },
    ],

    skills: {
      languages: [{ type: String }],
      frameworks: [{ type: String }],
      databases: [{ type: String }],
      tools: [{ type: String }],
      cloud: [{ type: String }],
      ai_ml: [{ type: String }],
      core_cs: [{ type: String }],
      soft_skills: [{ type: String }],
      other: [{ type: String }],
    },

    projects: [
      {
        name: { type: String, default: "" },
        techStack: [{ type: String }],
        bullets: [{ type: String }],
        impactSignals: [{ type: String }],
        weaknessSignals: [{ type: String }],
      },
    ],

    experience: [
      {
        company: { type: String, default: "" },
        role: { type: String, default: "" },
        duration: { type: String, default: "" },
        bullets: [{ type: String }],
      },
    ],

    achievements: [{ type: String }],
    certifications: [{ type: String }],
    codingProfiles: [{ type: String }],

    detectedTargetRole: { type: String, default: "" },
    seniorityDetected: { type: String, default: "" },
  },
  { _id: false }
);

const resumeDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    resumeName: {
      type: String,
      required: true,
      trim: true,
      default: "Untitled Resume",
    },

    targetRole: {
      type: String,
      default: "",
      trim: true,
    },

    targetCompany: {
      type: String,
      default: "",
      trim: true,
    },

    jobDescription: {
      type: String,
      default: "",
    },

    originalFileName: {
      type: String,
      default: "",
    },

    fileMimeType: {
      type: String,
      default: "",
    },

    fileSize: {
      type: Number,
      default: 0,
    },

    resumeUrl: {
      type: String,
      required: true,
    },

    cloudinaryPublicId: {
      type: String,
      default: "",
    },

    rawText: {
      type: String,
      default: "",
    },

    parsedProfile: {
      type: parsedProfileSchema,
      default: () => ({}),
    },

    status: {
      type: String,
      enum: ["uploaded", "parsed", "analyzed", "error"],
      default: "uploaded",
      index: true,
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },

    lastAnalyzedAt: {
      type: Date,
      default: null,
    },

    error: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

resumeDocumentSchema.index({ userId: 1, createdAt: -1 });
resumeDocumentSchema.index({ userId: 1, targetRole: 1, targetCompany: 1 });

module.exports = mongoose.model("ResumeDocument", resumeDocumentSchema);