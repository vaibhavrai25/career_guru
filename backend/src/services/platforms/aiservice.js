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
    throw new Error("GROQ_API_KEY is missing in .env");
  }

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return safeJsonParse(completion.choices?.[0]?.message?.content);
};

exports.generateStudyRoadmap = async (category, weaknesses = [], codingStats = {}) => {
  const focusTopic = weaknesses?.[0] || category || "general programming";

  const result = await runJsonLLM({
    systemPrompt: `
You are an expert software engineering and competitive programming mentor.
Return only valid JSON.
Do not include markdown.
Do not include explanations outside JSON.
Generate realistic links only when you are confident; otherwise use empty string.
`,
    userPrompt: `
Create a deep study roadmap for this student.

Category:
${category || "dsa"}

Main weak topics:
${JSON.stringify(weaknesses)}

Coding stats:
${JSON.stringify(codingStats, null, 2)}

Return this exact JSON structure:

{
  "focusTopic": "${focusTopic}",
  "description": "",
  "roadmap": [],
  "subTopics": [
    {
      "name": "",
      "description": "",
      "gfgLink": "",
      "theoryLinks": [
        {
          "label": "",
          "link": ""
        }
      ],
      "practiceSet": [
        {
          "title": "",
          "link": "",
          "difficulty": "Easy",
          "platform": "LeetCode"
        }
      ]
    }
  ]
}

Rules:
- Exactly 4 subTopics.
- Exactly 5 practice problems per subTopic.
- Total practice problems must be exactly 20.
- Difficulty split should be around 40% Easy and 60% Medium.
- Avoid Hard problems unless absolutely necessary.
`,
  });

  if (!Array.isArray(result.subTopics)) {
    result.subTopics = [];
  }

  if (!Array.isArray(result.roadmap)) {
    result.roadmap = [];
  }

  return result;
};

exports.generateStudyTasks = async (category, weaknesses = [], codingStats = {}) => {
  const roadmap = await exports.generateStudyRoadmap(category, weaknesses, codingStats);

  const tasks = [];

  roadmap.subTopics.forEach((subTopic) => {
    const practiceSet = Array.isArray(subTopic.practiceSet)
      ? subTopic.practiceSet
      : [];

    practiceSet.forEach((problem) => {
      tasks.push({
        title: problem.title || `${subTopic.name} practice problem`,
        description:
          subTopic.description ||
          `Practice ${subTopic.name || roadmap.focusTopic} to improve ${category || "dsa"} preparation.`,
        estimated_time:
          problem.difficulty?.toLowerCase() === "easy" ? "25-35 min" : "40-60 min",
        category: category || "dsa",
        type: "practice",
        priority:
          weaknesses?.[0] &&
          subTopic.name?.toLowerCase().includes(weaknesses[0].toLowerCase())
            ? "high"
            : "medium",
        resources: [
          {
            label: problem.title || "Practice Problem",
            link: problem.link || "",
            platform: problem.platform || "LeetCode",
          },
          ...(subTopic.gfgLink
            ? [
                {
                  label: `${subTopic.name} theory`,
                  link: subTopic.gfgLink,
                  platform: "GeeksforGeeks",
                },
              ]
            : []),
        ],
      });
    });
  });

  return tasks.slice(0, 20);
};