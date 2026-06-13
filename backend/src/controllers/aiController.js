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
      return res.status(400).json({ message: "A valid job description is required" });
    }

    const result = await runJsonLLM({
      systemPrompt: `You are an expert career analyst for software engineering internships. Return only valid JSON. Do not include markdown.`,
      userPrompt: `Analyze this job description for a student targeting ${targetRole || "SDE Internship"}.\n\nJob Description:\n${jobDescription}\n\nReturn this JSON:\n{\n  "role_summary": "",\n  "required_skills": [],\n  "preferred_skills": [],\n  "core_responsibilities": [],\n  "dsa_expectation": 0,\n  "development_expectation": 0,\n  "cs_fundamentals_expectation": 0,\n  "keywords": [],\n  "preparation_topics": [],\n  "resume_keywords_to_add": []\n}`,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Job description analysis failed", error: error.message });
  }
};

exports.generateSkillGap = async (req, res) => {
  try {
    const { resumeText, jobDescription, codingSummary, targetRole } = req.body;
    if (!resumeText && !codingSummary) {
      return res.status(400).json({ message: "Resume text or coding summary is required" });
    }

    const result = await runJsonLLM({
      systemPrompt: `You are an AI career readiness evaluator for software engineering internships. Return only valid JSON. Do not invent fake achievements.`,
      userPrompt: `Target Role:\n${targetRole || "SDE Internship"}\n\nResume Text:\n${resumeText || "Not provided"}\n\nCoding Summary:\n${JSON.stringify(codingSummary || {}, null, 2)}\n\nJob Description:\n${jobDescription || "Not provided"}\n\nReturn this JSON:\n{\n  "overall_match_score": 0,\n  "ready_now": false,\n  "strong_areas": [],\n  "weak_areas": [],\n  "missing_skills": [],\n  "priority_order": [],\n  "recommended_projects_to_improve": [],\n  "recommended_study_plan": [\n    {\n      "topic": "",\n      "reason": "",\n      "time_estimate": "",\n      "resources": []\n    }\n  ]\n}`,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Skill gap generation failed", error: error.message });
  }
};

exports.askCareerMentor = async (req, res) => {
  try {
    const { question, userContext } = req.body;
    if (!question || question.trim().length < 3) {
      return res.status(400).json({ message: "Question is required" });
    }

    const result = await runJsonLLM({
      systemPrompt: `You are a practical AI career mentor for software engineering students. Give direct, specific, actionable guidance. Return only valid JSON.`,
      userPrompt: `User Context:\n${JSON.stringify(userContext || {}, null, 2)}\n\nQuestion:\n${question}\n\nReturn this JSON:\n{\n  "answer": "",\n  "action_steps": [],\n  "topics_to_study": [],\n  "mistakes_to_avoid": [],\n  "priority": "low | medium | high"\n}`,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Career mentor failed", error: error.message });
  }
};

exports.analyzeGitHubProject = async (req, res) => {
  try {
    const { repoUrl, fileSummary } = req.body;
    if (!repoUrl && !fileSummary) {
      return res.status(400).json({ message: "GitHub repo URL or file summary is required" });
    }

    const result = await runJsonLLM({
      systemPrompt: `You are a senior software engineer reviewing a student's GitHub project. Return only valid JSON. Be specific and practical.`,
      userPrompt: `Repo URL:\n${repoUrl || "Not provided"}\n\nFile / Project Summary:\n${fileSummary || "Not provided"}\n\nReturn this JSON:\n{\n  "project_summary": "",\n  "detected_stack": [],\n  "architecture_explanation": "",\n  "strengths": [],\n  "bugs_or_risks": [],\n  "missing_features": [],\n  "improvement_roadmap": [],\n  "resume_bullets": [],\n  "readme_outline": [],\n  "interview_explanation": ""\n}`,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "GitHub project analysis failed", error: error.message });
  }
};

exports.generateTopicLearningPath = async (req, res) => {
  try {
    const { topicDescription } = req.body;

    if (!topicDescription || topicDescription.trim().length < 3) {
      return res.status(400).json({ message: "Please provide a topic description." });
    }

    const result = await runJsonLLM({
      systemPrompt: `You are an expert technical tutor for software engineering students. Create a highly specific, step-by-step learning path for the requested topic. Ensure links are to official docs or high-quality free resources (e.g., GeeksforGeeks, MDN, React Docs). Return ONLY valid JSON.`,
      userPrompt: `Topic to learn:\n${topicDescription}\n\nReturn this JSON:\n{
  "summary": "A 2-3 sentence overview of how to approach learning this topic.",
  "tasks": [
    {
      "title": "Clear task name (e.g., Learn Redis Memory Model)",
      "description": "Specific details on what to study or code.",
      "category": "dsa | development | core | system-design",
      "type": "theory | practice | project-build",
      "priority": "high | medium",
      "estimated_time": "30 min",
      "whyThisTask": "Why this step is crucial",
      "resources": [
        { "label": "Resource Name", "link": "https://..." }
      ]
    }
  ]
}`,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Topic Generator Error:", error.message);
    return res.status(500).json({ message: "Failed to generate learning path", error: error.message });
  }
};

// NEW: Targeted Topic Strengthener
exports.strengthenWeakness = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ message: "Topic is required to strengthen." });
    }

    const result = await runJsonLLM({
      systemPrompt: `You are a technical mentor. The user is struggling with a specific DSA or CS topic. Provide a 2 sentence explanation of the core concept and exactly ONE link to a high-quality GeeksforGeeks article, Leetcode explore card, or CP-Algorithms page about it. Return ONLY valid JSON.`,
      userPrompt: `Topic to strengthen:\n${topic}\n\nReturn this JSON:\n{
  "explanation": "A very brief, clear explanation of the core concept behind this topic.",
  "resourceLabel": "Name of the article or resource",
  "resourceLink": "https://..."
}`,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Strengthen Error:", error.message);
    return res.status(500).json({ message: "Failed to generate topic guide", error: error.message });
  }
};