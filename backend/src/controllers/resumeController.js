const pdf = require("pdf-parse");
const Groq = require("groq-sdk");
const streamifier = require("streamifier");

const cloudinary = require("../config/cloudinary");
const Profile = require("../models/Profile");
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

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No resume file provided",
      });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer);

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        resumeUrl: result.secure_url,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      message: "Resume uploaded successfully",
      resumeUrl: result.secure_url,
      profile,
    });
  } catch (error) {
    console.error("Resume Upload Error:", error.message);

    return res.status(500).json({
      message: "Resume upload failed",
      error: error.message,
    });
  }
};

exports.analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No resume file provided",
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        message: "GROQ_API_KEY is missing in server configuration",
      });
    }

    const cloudinaryResult = await uploadBufferToCloudinary(req.file.buffer);

    const parsedPdf = await pdf(req.file.buffer);
    const resumeText = parsedPdf.text?.trim() || "";

    if (resumeText.length < 150) {
      return res.status(400).json({
        message:
          "Could not extract enough text from this PDF. Please upload a text-based resume PDF, not a scanned image.",
      });
    }

    await Profile.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        resumeUrl: cloudinaryResult.secure_url,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    const systemPrompt = `
You are an expert technical recruiter and ATS resume reviewer for software engineering internships.

Return only valid JSON.
Do not include markdown.
Do not include explanations outside JSON.
Use realistic scoring.
Do not invent achievements that are not present in the resume.
If a section is missing, mention it clearly.
`;

    const userPrompt = `
Analyze the following resume for SDE internship readiness.

Resume Text:
${resumeText}

Return this exact JSON structure:

{
  "ats_score": 0,
  "impact_score": 0,
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "missing_keywords": [],
  "structural_telemetry": {
    "parsing": 0,
    "quantification": 0,
    "keywords": 0,
    "hierarchy": 0
  },
  "market_gap": [
    {
      "subject": "DSA",
      "user_score": 0,
      "target_score": 10
    },
    {
      "subject": "Projects",
      "user_score": 0,
      "target_score": 10
    },
    {
      "subject": "Backend",
      "user_score": 0,
      "target_score": 10
    },
    {
      "subject": "System Design",
      "user_score": 0,
      "target_score": 10
    },
    {
      "subject": "CS Fundamentals",
      "user_score": 0,
      "target_score": 10
    }
  ],
  "project_questions": [],
  "improved_bullets": [
    {
      "original": "",
      "improved": "",
      "reason": ""
    }
  ],
  "suggestions": [],
  "priority_actions": []
}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const rawContent = completion.choices?.[0]?.message?.content;
    const parsedAnalysis = safeJsonParse(rawContent);

    const savedAnalysis = await ResumeAnalysis.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        resumeUrl: cloudinaryResult.secure_url,
        resumeText,
        ...parsedAnalysis,
        analyzedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      message: "Resume analyzed successfully",
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

exports.getLatestResumeAnalysis = async (req, res) => {
  try {
    const analysis = await ResumeAnalysis.findOne({
      userId: req.user._id,
    }).sort({ updatedAt: -1 });

    if (!analysis) {
      return res.status(404).json({
        message: "No resume analysis found",
      });
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