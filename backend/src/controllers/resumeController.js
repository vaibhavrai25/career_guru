const pdfParseModule = require("pdf-parse");
const Groq = require("groq-sdk");
const streamifier = require("streamifier");

const cloudinary = require("../config/cloudinary");
const Profile = require("../models/Profile");
const ResumeDocument = require("../models/ResumeDocument");
const ResumeAnalysis = require("../models/ResumeAnalysis");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const uploadBufferToCloudinary = (fileBuffer, folder = "resumes") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

const safeJsonParse = (rawText) => {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("AI returned empty response");
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    const start = rawText.indexOf("{");
    const end = rawText.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("AI response did not contain valid JSON");
    }

    return JSON.parse(rawText.slice(start, end + 1));
  }
};

const extractTextFromPdfBuffer = async (buffer) => {
  let resumeText = "";

  try {
    if (typeof pdfParseModule === "function") {
      const parsedPdf = await pdfParseModule(buffer);
      resumeText = parsedPdf?.text || "";
    } else if (typeof pdfParseModule.default === "function") {
      const parsedPdf = await pdfParseModule.default(buffer);
      resumeText = parsedPdf?.text || "";
    } else if (pdfParseModule.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: buffer });

      try {
        const result = await parser.getText();
        resumeText = result?.text || "";
      } finally {
        if (typeof parser.destroy === "function") {
          await parser.destroy();
        }
      }
    } else if (typeof pdfParseModule.parse === "function") {
      const parsedPdf = await pdfParseModule.parse(buffer);
      resumeText = parsedPdf?.text || "";
    } else {
      throw new Error("Unsupported pdf-parse API shape.");
    }
  } catch (error) {
    console.error("PDF Parse Error:", error.message);
    throw new Error(
      "Could not extract text from PDF. Please upload a text-based PDF resume, not a scanned/image resume."
    );
  }

  resumeText = String(resumeText || "").trim();

  if (resumeText.length < 150) {
    throw new Error(
      "Could not extract enough text from this PDF. Please upload a text-based resume PDF."
    );
  }

  return resumeText;
};

const normalizeString = (value) => String(value || "").trim();

const buildResumeName = ({
  resumeName,
  targetRole,
  targetCompany,
  originalFileName,
}) => {
  if (normalizeString(resumeName)) return normalizeString(resumeName);

  const role = normalizeString(targetRole);
  const company = normalizeString(targetCompany);

  if (role && company) return `${company} ${role} Resume`;
  if (role) return `${role} Resume`;

  return originalFileName || "Untitled Resume";
};

const clampScore = (value) => {
  const num = Number(value);

  if (!Number.isFinite(num)) return 0;

  if (num <= 10 && num > 0) {
    return Math.round(num * 10);
  }

  return Math.max(0, Math.min(100, Math.round(num)));
};

const clampTenScore = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;

  if (num > 10) return Math.max(0, Math.min(10, Math.round(num / 10)));

  return Math.max(0, Math.min(10, Math.round(num)));
};

const normalizeAnalysis = (analysis) => {
  const normalized = {
    ...analysis,
    ats_score: clampScore(analysis.ats_score),
    readiness_score: clampScore(analysis.readiness_score),
    impact_score: clampScore(analysis.impact_score),
    jd_match_score: clampScore(analysis.jd_match_score),
    keyword_match_score: clampScore(analysis.keyword_match_score),
    project_relevance_score: clampScore(analysis.project_relevance_score),
  };

  normalized.score_breakdown = {
    parsing: clampScore(analysis.score_breakdown?.parsing),
    formatting: clampScore(analysis.score_breakdown?.formatting),
    keywordMatch: clampScore(analysis.score_breakdown?.keywordMatch),
    roleAlignment: clampScore(analysis.score_breakdown?.roleAlignment),
    projectDepth: clampScore(analysis.score_breakdown?.projectDepth),
    quantification: clampScore(analysis.score_breakdown?.quantification),
    technicalDepth: clampScore(analysis.score_breakdown?.technicalDepth),
    recruiterClarity: clampScore(analysis.score_breakdown?.recruiterClarity),
  };

  normalized.structural_telemetry = {
    parsing: clampScore(analysis.structural_telemetry?.parsing),
    quantification: clampScore(analysis.structural_telemetry?.quantification),
    keywords: clampScore(analysis.structural_telemetry?.keywords),
    hierarchy: clampScore(analysis.structural_telemetry?.hierarchy),
    lengthControl: clampScore(analysis.structural_telemetry?.lengthControl),
    sectionQuality: clampScore(analysis.structural_telemetry?.sectionQuality),
  };

  normalized.market_gap = Array.isArray(analysis.market_gap)
    ? analysis.market_gap.map((item) => ({
        subject: item.subject || "Unknown",
        user_score: clampTenScore(item.user_score),
        target_score: clampTenScore(item.target_score || 10),
        reason: item.reason || "",
      }))
    : [];

  normalized.gap_matrix = Array.isArray(analysis.gap_matrix)
    ? analysis.gap_matrix
    : [];

  normalized.bullet_rewrites = Array.isArray(analysis.bullet_rewrites)
    ? analysis.bullet_rewrites
    : [];

  normalized.interview_risks = Array.isArray(analysis.interview_risks)
    ? analysis.interview_risks
    : [];

  normalized.strengths = Array.isArray(analysis.strengths)
    ? analysis.strengths
    : [];

  normalized.weaknesses = Array.isArray(analysis.weaknesses)
    ? analysis.weaknesses
    : [];

  normalized.strong_keywords = Array.isArray(analysis.strong_keywords)
    ? analysis.strong_keywords
    : [];

  normalized.missing_keywords = Array.isArray(analysis.missing_keywords)
    ? analysis.missing_keywords
    : [];

  normalized.role_specific_keywords = Array.isArray(analysis.role_specific_keywords)
    ? analysis.role_specific_keywords
    : [];

  normalized.suggestions = Array.isArray(analysis.suggestions)
    ? analysis.suggestions
    : [];

  normalized.priority_actions = Array.isArray(analysis.priority_actions)
    ? analysis.priority_actions
    : [];

  normalized.company_tailoring = analysis.company_tailoring || {
    emphasize: [],
    deEmphasize: [],
    addKeywords: [],
    reorderSuggestions: [],
    companySpecificPitch: "",
  };

  return normalized;
};

const buildAnalysisPrompt = ({
  resumeText,
  targetRole,
  targetCompany,
  jobDescription,
}) => {
  const role = targetRole || "SDE Intern";
  const company = targetCompany || "Target company not specified";
  const jd = jobDescription || "No specific job description provided.";

  return `
You are evaluating a resume for a real software engineering internship application.

TARGET ROLE:
${role}

TARGET COMPANY:
${company}

JOB DESCRIPTION:
${jd}

RESUME TEXT:
${resumeText}

Return ONLY valid JSON. No markdown. No explanation outside JSON.

VERY IMPORTANT SCORING RULES:
- All percentage scores must be integers from 0 to 100.
- Do NOT use 0 to 10 for ATS/readiness/impact/JD/keyword/project scores.
- A decent student resume should usually be between 45 and 80, not 5 or 7, unless it is truly empty.
- Use strict but realistic scoring.
- Market gap scores are the only fields allowed to use 0 to 10.

Definitions:
- ats_score: resume parseability, section clarity, formatting, keyword density, standard resume structure.
- readiness_score: how ready the candidate looks for the target role/company.
- impact_score: bullet strength, quantified results, ownership, action verbs.
- jd_match_score: match with the target JD/company.
- keyword_match_score: relevant role/company keywords visible in resume.
- project_relevance_score: relevance and depth of projects for the target role.

Required JSON:
{
  "ats_score": 0,
  "readiness_score": 0,
  "impact_score": 0,
  "jd_match_score": 0,
  "keyword_match_score": 0,
  "project_relevance_score": 0,
  "verdict": "one-line hiring verdict",
  "summary": "Write a detailed 120-180 word recruiter-style summary. Mention current positioning, strongest evidence, weak signals, and what must change for this target role/company.",
  "parsed_profile": {
    "candidateName": "",
    "email": "",
    "phone": "",
    "targetRoleDetected": "",
    "seniorityDetected": "",
    "strongestProjects": [],
    "visibleSkills": [],
    "missingSignals": []
  },
  "score_breakdown": {
    "parsing": 0,
    "formatting": 0,
    "keywordMatch": 0,
    "roleAlignment": 0,
    "projectDepth": 0,
    "quantification": 0,
    "technicalDepth": 0,
    "recruiterClarity": 0
  },
  "structural_telemetry": {
    "parsing": 0,
    "quantification": 0,
    "keywords": 0,
    "hierarchy": 0,
    "lengthControl": 0,
    "sectionQuality": 0
  },
  "strengths": [
    "Precise strength with evidence from resume"
  ],
  "weaknesses": [
    "Precise weakness with why it hurts target role"
  ],
  "strong_keywords": [],
  "missing_keywords": [],
  "role_specific_keywords": [],
  "gap_matrix": [
    {
      "requirement": "specific JD/role requirement",
      "resumeEvidence": "exact resume evidence or 'Not visible'",
      "status": "strong",
      "priority": "high",
      "fix": "specific action to fix this gap"
    }
  ],
  "market_gap": [
    {
      "subject": "DSA / Problem Solving",
      "user_score": 0,
      "target_score": 10,
      "reason": "Specific reason"
    },
    {
      "subject": "Backend / APIs",
      "user_score": 0,
      "target_score": 10,
      "reason": "Specific reason"
    },
    {
      "subject": "Full Stack Projects",
      "user_score": 0,
      "target_score": 10,
      "reason": "Specific reason"
    },
    {
      "subject": "AI / LLM Relevance",
      "user_score": 0,
      "target_score": 10,
      "reason": "Specific reason"
    },
    {
      "subject": "CS Fundamentals",
      "user_score": 0,
      "target_score": 10,
      "reason": "Specific reason"
    },
    {
      "subject": "Impact / Metrics",
      "user_score": 0,
      "target_score": 10,
      "reason": "Specific reason"
    }
  ],
  "bullet_rewrites": [
    {
      "section": "Projects / Experience / Achievements",
      "projectOrExperience": "",
      "original": "exact weak bullet from resume",
      "problem": "why this bullet is weak",
      "improved": "exact improved replacement bullet using only resume evidence",
      "whyBetter": "why this improved bullet is stronger",
      "targetKeywordBoost": []
    }
  ],
  "company_tailoring": {
    "emphasize": [],
    "deEmphasize": [],
    "addKeywords": [],
    "reorderSuggestions": [],
    "companySpecificPitch": ""
  },
  "interview_risks": [
    {
      "question": "",
      "whyTheyWillAsk": "",
      "weakSignal": "",
      "howToPrepare": ""
    }
  ],
  "project_questions": [],
  "suggestions": [],
  "priority_actions": [],
  "final_resume_strategy": ""
}

Rules:
- Do not invent achievements, numbers, links, or companies.
- Bullet rewrites must be exact replacement text.
- If evidence is missing, say it is missing.
- Make gap matrix and market gap precise, not generic.
`;
};

const getAIAnalysis = async ({
  resumeText,
  targetRole,
  targetCompany,
  jobDescription,
}) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing in server configuration");
  }

  const systemPrompt = `
You are a senior technical recruiter, ATS evaluator, and software engineering resume strategist.
Return only valid JSON.
All percentage scores must be 0-100 integers.
Market gap scores are 0-10.
Do not invent facts.
Be strict but realistic.
`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    temperature: 0.1,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: buildAnalysisPrompt({
          resumeText,
          targetRole,
          targetCompany,
          jobDescription,
        }),
      },
    ],
  });

  const rawContent = completion.choices?.[0]?.message?.content;
  const parsed = safeJsonParse(rawContent);

  return normalizeAnalysis(parsed);
};

const extractParsedProfileForDocument = (analysis) => {
  const parsed = analysis?.parsed_profile || {};

  return {
    candidateName: parsed.candidateName || "",
    email: parsed.email || "",
    phone: parsed.phone || "",
    links: {
      github: "",
      linkedin: "",
      leetcode: "",
      portfolio: "",
      codeforces: "",
      codechef: "",
      others: [],
    },
    education: [],
    skills: {
      languages: [],
      frameworks: [],
      databases: [],
      tools: [],
      cloud: [],
      ai_ml: [],
      core_cs: [],
      soft_skills: [],
      other: parsed.visibleSkills || [],
    },
    projects: (parsed.strongestProjects || []).map((name) => ({
      name,
      techStack: [],
      bullets: [],
      impactSignals: [],
      weaknessSignals: [],
    })),
    experience: [],
    achievements: [],
    certifications: [],
    codingProfiles: [],
    detectedTargetRole: parsed.targetRoleDetected || "",
    seniorityDetected: parsed.seniorityDetected || "",
  };
};

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No resume file provided" });
    }

    const {
      resumeName,
      targetRole = "",
      targetCompany = "",
      jobDescription = "",
      isPrimary = false,
    } = req.body;

    const resumeText = await extractTextFromPdfBuffer(req.file.buffer);
    const cloudinaryResult = await uploadBufferToCloudinary(req.file.buffer);

    const finalResumeName = buildResumeName({
      resumeName,
      targetRole,
      targetCompany,
      originalFileName: req.file.originalname,
    });

    if (isPrimary === "true" || isPrimary === true) {
      await ResumeDocument.updateMany(
        { userId: req.user._id },
        { $set: { isPrimary: false } }
      );
    }

    const document = await ResumeDocument.create({
      userId: req.user._id,
      resumeName: finalResumeName,
      targetRole: normalizeString(targetRole),
      targetCompany: normalizeString(targetCompany),
      jobDescription: normalizeString(jobDescription),
      originalFileName: req.file.originalname,
      fileMimeType: req.file.mimetype,
      fileSize: req.file.size,
      resumeUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id || "",
      rawText: resumeText,
      status: "parsed",
      isPrimary: isPrimary === "true" || isPrimary === true,
    });

    await Profile.findOneAndUpdate(
      { userId: req.user._id },
      { userId: req.user._id, resumeUrl: cloudinaryResult.secure_url },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(201).json({
      message: "Resume uploaded and parsed successfully",
      document,
    });
  } catch (error) {
    console.error("Resume Upload Error:", error.message);

    return res.status(500).json({
      message: "Resume upload failed",
      error: error.message,
    });
  }
};

exports.getResumeDocuments = async (req, res) => {
  try {
    const documents = await ResumeDocument.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      total: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error("Get Resume Documents Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch resume documents",
      error: error.message,
    });
  }
};

exports.getResumeDocumentById = async (req, res) => {
  try {
    const document = await ResumeDocument.findOne({
      _id: req.params.resumeId,
      userId: req.user._id,
    }).lean();

    if (!document) {
      return res.status(404).json({ message: "Resume document not found" });
    }

    return res.status(200).json(document);
  } catch (error) {
    console.error("Get Resume Document Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch resume document",
      error: error.message,
    });
  }
};

exports.deleteResumeDocument = async (req, res) => {
  try {
    const document = await ResumeDocument.findOne({
      _id: req.params.resumeId,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: "Resume document not found" });
    }

    if (document.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(document.cloudinaryPublicId, {
          resource_type: "raw",
        });
      } catch (cloudinaryError) {
        console.warn("Cloudinary delete skipped:", cloudinaryError.message);
      }
    }

    await ResumeAnalysis.deleteMany({
      userId: req.user._id,
      resumeId: document._id,
    });

    await document.deleteOne();

    return res.status(200).json({
      message: "Resume document deleted successfully",
    });
  } catch (error) {
    console.error("Delete Resume Document Error:", error.message);

    return res.status(500).json({
      message: "Failed to delete resume document",
      error: error.message,
    });
  }
};

exports.analyzeResumeById = async (req, res) => {
  try {
    const document = await ResumeDocument.findOne({
      _id: req.params.resumeId,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: "Resume document not found" });
    }

    const targetRole =
      normalizeString(req.body.targetRole) || document.targetRole || "SDE Intern";
    const targetCompany =
      normalizeString(req.body.targetCompany) || document.targetCompany || "";
    const jobDescription =
      normalizeString(req.body.jobDescription) || document.jobDescription || "";

    const parsedAnalysis = await getAIAnalysis({
      resumeText: document.rawText,
      targetRole,
      targetCompany,
      jobDescription,
    });

    const savedAnalysis = await ResumeAnalysis.create({
      userId: req.user._id,
      resumeId: document._id,
      resumeUrl: document.resumeUrl,
      resumeText: document.rawText,
      targetRole,
      targetCompany,
      jobDescription,
      ...parsedAnalysis,
      rawAI: parsedAnalysis,
      analyzedAt: new Date(),
    });

    document.targetRole = targetRole;
    document.targetCompany = targetCompany;
    document.jobDescription = jobDescription;
    document.parsedProfile = extractParsedProfileForDocument(parsedAnalysis);
    document.status = "analyzed";
    document.lastAnalyzedAt = new Date();
    document.error = "";
    await document.save();

    return res.status(200).json({
      message: "Resume analyzed successfully",
      analysis: savedAnalysis,
      document,
    });
  } catch (error) {
    console.error("Resume Analysis Error:", error.message);

    if (req.params.resumeId) {
      await ResumeDocument.findOneAndUpdate(
        { _id: req.params.resumeId, userId: req.user._id },
        { $set: { status: "error", error: error.message } }
      );
    }

    return res.status(500).json({
      message: "Resume analysis failed",
      error: error.message,
    });
  }
};

exports.analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No resume file provided" });
    }

    const {
      resumeName,
      targetRole = "SDE Intern",
      targetCompany = "",
      jobDescription = "",
      isPrimary = true,
    } = req.body;

    const resumeText = await extractTextFromPdfBuffer(req.file.buffer);
    const cloudinaryResult = await uploadBufferToCloudinary(req.file.buffer);

    const finalResumeName = buildResumeName({
      resumeName,
      targetRole,
      targetCompany,
      originalFileName: req.file.originalname,
    });

    if (isPrimary === "true" || isPrimary === true) {
      await ResumeDocument.updateMany(
        { userId: req.user._id },
        { $set: { isPrimary: false } }
      );
    }

    const document = await ResumeDocument.create({
      userId: req.user._id,
      resumeName: finalResumeName,
      targetRole: normalizeString(targetRole),
      targetCompany: normalizeString(targetCompany),
      jobDescription: normalizeString(jobDescription),
      originalFileName: req.file.originalname,
      fileMimeType: req.file.mimetype,
      fileSize: req.file.size,
      resumeUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id || "",
      rawText: resumeText,
      status: "parsed",
      isPrimary: isPrimary === "true" || isPrimary === true,
    });

    await Profile.findOneAndUpdate(
      { userId: req.user._id },
      { userId: req.user._id, resumeUrl: cloudinaryResult.secure_url },
      { upsert: true, new: true, runValidators: true }
    );

    const parsedAnalysis = await getAIAnalysis({
      resumeText,
      targetRole: normalizeString(targetRole) || "SDE Intern",
      targetCompany: normalizeString(targetCompany),
      jobDescription: normalizeString(jobDescription),
    });

    const savedAnalysis = await ResumeAnalysis.create({
      userId: req.user._id,
      resumeId: document._id,
      resumeUrl: cloudinaryResult.secure_url,
      resumeText,
      targetRole: normalizeString(targetRole) || "SDE Intern",
      targetCompany: normalizeString(targetCompany),
      jobDescription: normalizeString(jobDescription),
      ...parsedAnalysis,
      rawAI: parsedAnalysis,
      analyzedAt: new Date(),
    });

    document.parsedProfile = extractParsedProfileForDocument(parsedAnalysis);
    document.status = "analyzed";
    document.lastAnalyzedAt = new Date();
    await document.save();

    return res.status(200).json({
      message: "Resume uploaded and analyzed successfully",
      document,
      analysis: savedAnalysis,
    });
  } catch (error) {
    console.error("Resume Analysis Error:", error.message);

    return res.status(500).json({
      message: "Resume analysis failed",
      error: error.message,
    });
  }
};

exports.getResumeAnalysisByResumeId = async (req, res) => {
  try {
    const analyses = await ResumeAnalysis.find({
      userId: req.user._id,
      resumeId: req.params.resumeId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      total: analyses.length,
      data: analyses,
    });
  } catch (error) {
    console.error("Fetch Resume Analysis Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch resume analysis",
      error: error.message,
    });
  }
};

exports.getLatestResumeAnalysis = async (req, res) => {
  try {
    const analysis = await ResumeAnalysis.findOne({
      userId: req.user._id,
    }).sort({ updatedAt: -1 });

    if (!analysis) {
      return res.status(404).json({ message: "No resume analysis found" });
    }

    return res.status(200).json(analysis);
  } catch (error) {
    console.error("Fetch Resume Analysis Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch resume analysis",
      error: error.message,
    });
  }
};