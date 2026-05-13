const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

const runJsonLLM = async ({ systemPrompt, userPrompt }) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing in server configuration");
  }

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return safeJsonParse(completion.choices?.[0]?.message?.content);
};

exports.analyzeJobDescription = async (req, res) => {
  try {
    const { jobDescription, targetRole } = req.body;

    if (!jobDescription || jobDescription.trim().length < 50) {
      return res.status(400).json({
        message: "A valid job description is required",
      });
    }

    const result = await runJsonLLM({
      systemPrompt: `
You are an expert career analyst for software engineering internships.
Return only valid JSON.
Do not include markdown.
`,
      userPrompt: `
Analyze this job description for a student targeting ${targetRole || "SDE Internship"}.

Job Description:
${jobDescription}

Return this JSON:

{
  "role_summary": "",
  "required_skills": [],
  "preferred_skills": [],
  "core_responsibilities": [],
  "dsa_expectation": 0,
  "development_expectation": 0,
  "cs_fundamentals_expectation": 0,
  "keywords": [],
  "preparation_topics": [],
  "resume_keywords_to_add": []
}
`,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("JD Analysis Error:", error.message);

    return res.status(500).json({
      message: "Job description analysis failed",
      error: error.message,
    });
  }
};

exports.generateSkillGap = async (req, res) => {
  try {
    const { resumeText, jobDescription, codingSummary, targetRole } = req.body;

    if (!resumeText && !codingSummary) {
      return res.status(400).json({
        message: "Resume text or coding summary is required",
      });
    }

    const result = await runJsonLLM({
      systemPrompt: `
You are an AI career readiness evaluator for software engineering internships.
Return only valid JSON.
Do not invent fake achievements.
`,
      userPrompt: `
Target Role:
${targetRole || "SDE Internship"}

Resume Text:
${resumeText || "Not provided"}

Coding Summary:
${JSON.stringify(codingSummary || {}, null, 2)}

Job Description:
${jobDescription || "Not provided"}

Return this JSON:

{
  "overall_match_score": 0,
  "ready_now": false,
  "strong_areas": [],
  "weak_areas": [],
  "missing_skills": [],
  "priority_order": [],
  "recommended_projects_to_improve": [],
  "recommended_study_plan": [
    {
      "topic": "",
      "reason": "",
      "time_estimate": "",
      "resources": []
    }
  ]
}
`,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Skill Gap Error:", error.message);

    return res.status(500).json({
      message: "Skill gap generation failed",
      error: error.message,
    });
  }
};

exports.askCareerMentor = async (req, res) => {
  try {
    const { question, userContext } = req.body;

    if (!question || question.trim().length < 3) {
      return res.status(400).json({
        message: "Question is required",
      });
    }

    const result = await runJsonLLM({
      systemPrompt: `
You are a practical AI career mentor for software engineering students.
Give direct, specific, actionable guidance.
Return only valid JSON.
`,
      userPrompt: `
User Context:
${JSON.stringify(userContext || {}, null, 2)}

Question:
${question}

Return this JSON:

{
  "answer": "",
  "action_steps": [],
  "topics_to_study": [],
  "mistakes_to_avoid": [],
  "priority": "low | medium | high"
}
`,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Career Mentor Error:", error.message);

    return res.status(500).json({
      message: "Career mentor failed",
      error: error.message,
    });
  }
};

exports.analyzeGitHubProject = async (req, res) => {
  try {
    const { repoUrl, fileSummary } = req.body;

    if (!repoUrl && !fileSummary) {
      return res.status(400).json({
        message: "GitHub repo URL or file summary is required",
      });
    }

    const result = await runJsonLLM({
      systemPrompt: `
You are a senior software engineer reviewing a student's GitHub project.
Return only valid JSON.
Be specific and practical.
`,
      userPrompt: `
Repo URL:
${repoUrl || "Not provided"}

File / Project Summary:
${fileSummary || "Not provided"}

Return this JSON:

{
  "project_summary": "",
  "detected_stack": [],
  "architecture_explanation": "",
  "strengths": [],
  "bugs_or_risks": [],
  "missing_features": [],
  "improvement_roadmap": [],
  "resume_bullets": [],
  "readme_outline": [],
  "interview_explanation": ""
}
`,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("GitHub Analyzer Error:", error.message);

    return res.status(500).json({
      message: "GitHub project analysis failed",
      error: error.message,
    });
  }
};