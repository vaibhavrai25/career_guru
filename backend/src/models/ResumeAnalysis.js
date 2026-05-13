const mongoose = require("mongoose");

const structuralTelemetrySchema = new mongoose.Schema(
  {
    parsing: { type: Number, default: 0 },
    quantification: { type: Number, default: 0 },
    keywords: { type: Number, default: 0 },
    hierarchy: { type: Number, default: 0 },
  },
  { _id: false }
);

const marketGapSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    user_score: { type: Number, default: 0 },
    target_score: { type: Number, default: 10 },
  },
  { _id: false }
);

const improvedBulletSchema = new mongoose.Schema(
  {
    original: { type: String, default: "" },
    improved: { type: String, default: "" },
    reason: { type: String, default: "" },
  },
  { _id: false }
);

const resumeAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    resumeUrl: { type: String, default: "" },
    resumeText: { type: String, default: "" },

    ats_score: { type: Number, default: 0 },
    impact_score: { type: Number, default: 0 },

    summary: { type: String, default: "" },

    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    missing_keywords: [{ type: String }],

    structural_telemetry: {
      type: structuralTelemetrySchema,
      default: () => ({}),
    },

    market_gap: [marketGapSchema],

    project_questions: [{ type: String }],

    improved_bullets: [improvedBulletSchema],

    suggestions: [{ type: String }],
    priority_actions: [{ type: String }],

    analyzedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

resumeAnalysisSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("ResumeAnalysis", resumeAnalysisSchema);