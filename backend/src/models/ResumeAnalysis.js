const mongoose = require("mongoose");

const scoreBreakdownSchema = new mongoose.Schema(
  {
    parsing: { type: Number, default: 0 },
    formatting: { type: Number, default: 0 },
    keywordMatch: { type: Number, default: 0 },
    roleAlignment: { type: Number, default: 0 },
    projectDepth: { type: Number, default: 0 },
    quantification: { type: Number, default: 0 },
    technicalDepth: { type: Number, default: 0 },
    recruiterClarity: { type: Number, default: 0 },
  },
  { _id: false }
);

const structuralTelemetrySchema = new mongoose.Schema(
  {
    parsing: { type: Number, default: 0 },
    quantification: { type: Number, default: 0 },
    keywords: { type: Number, default: 0 },
    hierarchy: { type: Number, default: 0 },
    lengthControl: { type: Number, default: 0 },
    sectionQuality: { type: Number, default: 0 },
  },
  { _id: false }
);

const gapMatrixSchema = new mongoose.Schema(
  {
    requirement: { type: String, default: "" },
    resumeEvidence: { type: String, default: "" },
    status: {
      type: String,
      enum: ["strong", "medium", "weak", "missing"],
      default: "missing",
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    fix: { type: String, default: "" },
  },
  { _id: false }
);

const bulletRewriteSchema = new mongoose.Schema(
  {
    section: { type: String, default: "" },
    projectOrExperience: { type: String, default: "" },
    original: { type: String, default: "" },
    problem: { type: String, default: "" },
    improved: { type: String, default: "" },
    whyBetter: { type: String, default: "" },
    targetKeywordBoost: [{ type: String }],
  },
  { _id: false }
);

const marketGapSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    user_score: { type: Number, default: 0 },
    target_score: { type: Number, default: 10 },
    reason: { type: String, default: "" },
  },
  { _id: false }
);

const companyTailoringSchema = new mongoose.Schema(
  {
    emphasize: [{ type: String }],
    deEmphasize: [{ type: String }],
    addKeywords: [{ type: String }],
    reorderSuggestions: [{ type: String }],
    companySpecificPitch: { type: String, default: "" },
  },
  { _id: false }
);

const interviewRiskSchema = new mongoose.Schema(
  {
    question: { type: String, default: "" },
    whyTheyWillAsk: { type: String, default: "" },
    weakSignal: { type: String, default: "" },
    howToPrepare: { type: String, default: "" },
  },
  { _id: false }
);

const parsedProfileSchema = new mongoose.Schema(
  {
    candidateName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    targetRoleDetected: { type: String, default: "" },
    seniorityDetected: { type: String, default: "" },
    strongestProjects: [{ type: String }],
    visibleSkills: [{ type: String }],
    missingSignals: [{ type: String }],
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

    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeDocument",
      index: true,
      default: null,
    },

    resumeUrl: { type: String, default: "" },
    resumeText: { type: String, default: "" },

    targetRole: { type: String, default: "" },
    targetCompany: { type: String, default: "" },
    jobDescription: { type: String, default: "" },

    ats_score: { type: Number, default: 0 },
    readiness_score: { type: Number, default: 0 },
    impact_score: { type: Number, default: 0 },
    jd_match_score: { type: Number, default: 0 },
    keyword_match_score: { type: Number, default: 0 },
    project_relevance_score: { type: Number, default: 0 },

    verdict: { type: String, default: "" },
    summary: { type: String, default: "" },

    parsed_profile: {
      type: parsedProfileSchema,
      default: () => ({}),
    },

    score_breakdown: {
      type: scoreBreakdownSchema,
      default: () => ({}),
    },

    structural_telemetry: {
      type: structuralTelemetrySchema,
      default: () => ({}),
    },

    strengths: [{ type: String }],
    weaknesses: [{ type: String }],

    strong_keywords: [{ type: String }],
    missing_keywords: [{ type: String }],
    role_specific_keywords: [{ type: String }],

    gap_matrix: [gapMatrixSchema],
    market_gap: [marketGapSchema],

    bullet_rewrites: [bulletRewriteSchema],

    company_tailoring: {
      type: companyTailoringSchema,
      default: () => ({}),
    },

    interview_risks: [interviewRiskSchema],

    project_questions: [{ type: String }],
    suggestions: [{ type: String }],
    priority_actions: [{ type: String }],
    final_resume_strategy: { type: String, default: "" },

    rawAI: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    analyzedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

resumeAnalysisSchema.index({ userId: 1, updatedAt: -1 });
resumeAnalysisSchema.index({ userId: 1, resumeId: 1, createdAt: -1 });

module.exports = mongoose.model("ResumeAnalysis", resumeAnalysisSchema);