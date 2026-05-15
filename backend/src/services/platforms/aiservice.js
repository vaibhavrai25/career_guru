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

const runJsonLLM = async ({ systemPrompt, userPrompt, temperature = 0.15 }) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing in .env");
  }

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return safeJsonParse(completion.choices?.[0]?.message?.content);
};

const toPlainObject = (value) => {
  if (!value) return {};

  if (value instanceof Map) {
    return Object.fromEntries(value);
  }

  if (typeof value.toObject === "function") {
    return value.toObject();
  }

  if (typeof value === "object") {
    return value;
  }

  return {};
};

const summarizeCodingStats = (codingStats = {}) => {
  const platforms = ["leetcode", "codeforces", "codechef"];

  const platformSummary = platforms.reduce((acc, platform) => {
    const data = codingStats?.[platform] || {};

    acc[platform] = {
      handle: data.handle || "",
      totalSolved: Number(data.totalSolved || 0),
      easy: Number(data.easy || 0),
      medium: Number(data.medium || 0),
      hard: Number(data.hard || 0),
      rating: Number(data.rating || 0),
      maxRating: Number(data.maxRating || 0),
      rank: data.rank || "",
      currentStreak: Number(data.streak || data.submissionsSummary?.currentStreak || 0),
      maxStreak: Number(data.maxStreak || data.submissionsSummary?.maxStreak || 0),
      activeDays: Number(data.activeDays || data.submissionsSummary?.activeDays || 0),
      topicWise: toPlainObject(data.topicWise),
    };

    return acc;
  }, {});

  const github = codingStats?.github || {};

  const githubSummary = {
    handle: github.handle || "",
    totalRepos: Number(github.totalRepos || github.publicRepos || 0),
    followers: Number(github.followers || 0),
    languageWise: toPlainObject(github.languageWise),
    projectSignals: github.projectSignals || {},
    pinnedRepos: Array.isArray(github.pinnedRepos)
      ? github.pinnedRepos.slice(0, 5).map((repo) => ({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          topics: repo.topics || [],
          stars: repo.stars || 0,
          qualityScore: repo.quality?.qualityScore || 0,
          hasReadme: repo.quality?.hasReadme || false,
          hasTests: repo.quality?.hasTests || false,
          hasDeployment: repo.quality?.hasDeployment || false,
        }))
      : [],
  };

  return {
    platforms: platformSummary,
    github: githubSummary,
    combined: codingStats?.combined || {},
  };
};

const normalizeCategory = (category) => {
  const clean = String(category || "dsa").toLowerCase().trim();

  const allowed = ["dsa", "development", "core", "resume", "system-design", "mixed"];

  return allowed.includes(clean) ? clean : "dsa";
};

const normalizeIntensity = (intensity) => {
  const clean = String(intensity || "medium").toLowerCase().trim();

  const allowed = ["light", "medium", "hard", "extreme"];

  return allowed.includes(clean) ? clean : "medium";
};

const clampTimelineDays = (timelineDays) => {
  const days = Number(timelineDays || 7);

  if (!Number.isFinite(days)) return 7;

  return Math.max(3, Math.min(30, Math.round(days)));
};

const getTaskLimit = ({ mode, intensity }) => {
  if (mode === "mission-plan") {
    if (intensity === "light") return 5;
    if (intensity === "medium") return 6;
    if (intensity === "hard") return 7;
    return 8;
  }

  if (intensity === "light") return 3;
  if (intensity === "medium") return 4;
  if (intensity === "hard") return 5;
  return 6;
};

const makeFallbackRoadmap = ({
  category,
  weaknesses = [],
  targetRole = "SDE Intern",
  targetCompany = "",
  timelineDays = 7,
  intensity = "medium",
  mode = "roadmap",
}) => {
  const focusTopic = weaknesses?.[0] || category || "general preparation";
  const taskLimit = getTaskLimit({ mode, intensity });

  const commonResources = [
    {
      label: `Striver A2Z Sheet - ${focusTopic}`,
      link: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
      platform: "Striver",
    },
    {
      label: `LeetCode tag practice - ${focusTopic}`,
      link: "https://leetcode.com/problemset/",
      platform: "LeetCode",
    },
    {
      label: `GeeksforGeeks theory - ${focusTopic}`,
      link: "https://www.geeksforgeeks.org/data-structures/",
      platform: "GeeksforGeeks",
    },
  ];

  const fallbackTasks = [
    {
      title: `Study core theory of ${focusTopic}`,
      description: `Understand definitions, patterns, edge cases, and common interview traps for ${focusTopic}.`,
      estimated_time: "35 min",
      effortMinutes: 35,
      category,
      type: "theory",
      priority: "high",
      subTopic: focusTopic,
      whyThisTask: `This starts the chain by building the base concept before solving problems.`,
      successCriteria: "Write 5-7 short notes and explain the pattern without looking.",
      resources: [commonResources[2]],
    },
    {
      title: `Solve easy warm-up problems on ${focusTopic}`,
      description: `Solve beginner-level problems to verify that the theory is clear.`,
      estimated_time: "45 min",
      effortMinutes: 45,
      category,
      type: "leetcode",
      priority: "high",
      subTopic: focusTopic,
      whyThisTask: "This converts theory into basic implementation confidence.",
      successCriteria: "Solve at least 2 easy problems without hints.",
      resources: [commonResources[1], commonResources[0]],
    },
    {
      title: `Solve medium pattern problems on ${focusTopic}`,
      description: `Move to medium-level questions from a known sheet or platform.`,
      estimated_time: "60 min",
      effortMinutes: 60,
      category,
      type: "leetcode",
      priority: "high",
      subTopic: focusTopic,
      whyThisTask: "This builds interview-level problem solving depth.",
      successCriteria: "Solve at least 2 medium problems and document mistakes.",
      resources: [commonResources[0], commonResources[1]],
    },
    {
      title: `Upsolve and revise mistakes in ${focusTopic}`,
      description: `Review failed attempts and convert mistakes into reusable patterns.`,
      estimated_time: "30 min",
      effortMinutes: 30,
      category,
      type: "revision",
      priority: "medium",
      subTopic: focusTopic,
      whyThisTask: "Revision makes the learning stick and prevents repeat mistakes.",
      successCriteria: "Write mistake notes and one clean final approach.",
      resources: [commonResources[0]],
    },
    {
      title: `Attempt one timed block on ${focusTopic}`,
      description: `Practice under time pressure to simulate contest/interview conditions.`,
      estimated_time: "45 min",
      effortMinutes: 45,
      category,
      type: "practice",
      priority: "medium",
      subTopic: focusTopic,
      whyThisTask: "Timing pressure reveals weak implementation habits.",
      successCriteria: "Finish the block and record time taken per problem.",
      resources: [commonResources[1]],
    },
  ].slice(0, taskLimit);

  return {
    focusTopic,
    description: `A compact connected task chain for ${targetRole}${
      targetCompany ? ` at ${targetCompany}` : ""
    }. It starts with theory, moves into easy practice, then medium practice, and ends with revision.`,
    roadmap: [
      "Learn theory",
      "Do easy warm-up",
      "Solve medium pattern problems",
      "Review mistakes",
      "Practice timed execution",
    ],
    subTopics: [
      {
        name: focusTopic,
        description: `Compact mastery path for ${focusTopic}.`,
        gfgLink: "https://www.geeksforgeeks.org/data-structures/",
        theoryLinks: [
          {
            label: `GeeksforGeeks theory for ${focusTopic}`,
            link: "https://www.geeksforgeeks.org/data-structures/",
            platform: "GeeksforGeeks",
          },
        ],
        practiceSet: [
          {
            title: `Practice ${focusTopic} from Striver A2Z`,
            link: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
            difficulty: "Medium",
            platform: "Striver",
          },
        ],
      },
    ],
    dailyPlan: [
      {
        day: 1,
        date: "",
        title: `${focusTopic} compact mission`,
        focus: focusTopic,
        estimatedMinutes: fallbackTasks.reduce(
          (sum, task) => sum + Number(task.effortMinutes || 30),
          0
        ),
        tasks: fallbackTasks,
      },
    ],
    tasks: fallbackTasks,
    analysis: {
      mainWeakness: focusTopic,
      reason: `${focusTopic} was detected as a weak or selected focus area.`,
      expectedOutcome: "Better conceptual clarity, cleaner implementation, and better interview explanation.",
      risk: "Doing too many disconnected tasks will reduce retention.",
      adjustmentAdvice: "Complete tasks in order. Do not skip theory or revision.",
    },
  };
};

const systemPrompt = `
You are an elite software engineering internship mentor and competitive programming coach.

Your job is to create a SHORT, CONNECTED, execution-focused study task chain.

Return only valid JSON.
No markdown.
No prose outside JSON.
Do not invent user statistics.
Do not create too many tasks.
Every task must include a useful resource link.
All tasks must be connected to the same focus topic or same mission.
`;

const buildRoadmapPrompt = ({
  category,
  weaknesses,
  codingStats,
  options,
}) => {
  const focusTopic = weaknesses?.[0] || category || "general programming";
  const targetRole = options.targetRole || "SDE Intern";
  const targetCompany = options.targetCompany || "";
  const timelineDays = clampTimelineDays(options.timelineDays || 7);
  const intensity = normalizeIntensity(options.intensity || "medium");
  const mode = options.mode || "roadmap";
  const taskLimit = getTaskLimit({ mode, intensity });

  const summarizedStats = summarizeCodingStats(codingStats);

  return `
Create a compact connected study plan.

MODE:
${mode}

CATEGORY:
${category}

TARGET ROLE:
${targetRole}

TARGET COMPANY:
${targetCompany || "Not specified"}

TIMELINE DAYS:
${timelineDays}

INTENSITY:
${intensity}

MAX TASKS TO SAVE:
${taskLimit}

FOCUS TOPIC:
${focusTopic}

WEAK TOPICS:
${JSON.stringify(weaknesses || [])}

CODING STATS SUMMARY:
${JSON.stringify(summarizedStats, null, 2)}

IMPORTANT RULES:
1. Generate exactly ${taskLimit} tasks. Not more.
2. All tasks must be connected in one learning chain.
3. The order must be:
   - theory / concept
   - easy warm-up practice
   - medium practice
   - revision/upsolve
   - timed practice or interview explanation
4. Every task must include at least one resource link.
5. Practice resources should come from:
   - LeetCode
   - GeeksforGeeks
   - Striver A2Z Sheet
   - Striver SDE Sheet
   - CP31 Sheet / TLE Eliminators CP Sheet
   - Codeforces problemset
6. Theory resources should come from:
   - GeeksforGeeks
   - TakeUForward / Striver
   - official docs for development topics
7. Do not give random unrelated tasks.
8. Do not give 15-20 tasks.
9. Do not create fake exact problem links unless you are confident. Use sheet/topic links when exact problem URL is uncertain.
10. Resource label must clearly say what the user should do on that link.

Return this exact JSON shape:

{
  "focusTopic": "${focusTopic}",
  "description": "2-3 sentence explanation of this connected plan.",
  "roadmap": [
    "Step 1",
    "Step 2",
    "Step 3"
  ],
  "subTopics": [
    {
      "name": "Main topic or subtopic",
      "description": "Why this matters.",
      "gfgLink": "https://www.geeksforgeeks.org/...",
      "theoryLinks": [
        {
          "label": "Read theory for topic",
          "link": "https://www.geeksforgeeks.org/...",
          "platform": "GeeksforGeeks"
        }
      ],
      "practiceSet": [
        {
          "title": "Practice topic from known sheet",
          "link": "https://takeuforward.org/...",
          "difficulty": "Medium",
          "platform": "Striver"
        }
      ]
    }
  ],
  "dailyPlan": [
    {
      "day": 1,
      "date": "",
      "title": "Connected mission title",
      "focus": "${focusTopic}",
      "estimatedMinutes": 120,
      "tasks": []
    }
  ],
  "tasks": [
    {
      "title": "Specific connected task title",
      "description": "What exactly to do.",
      "estimated_time": "45 min",
      "effortMinutes": 45,
      "category": "${category}",
      "type": "theory",
      "priority": "high",
      "subTopic": "${focusTopic}",
      "whyThisTask": "Why this task comes at this step in the chain.",
      "successCriteria": "Clear measurable completion condition.",
      "resources": [
        {
          "label": "Read/solve exactly what on this resource",
          "link": "https://...",
          "platform": "LeetCode/GFG/Striver/CP31/Codeforces"
        }
      ]
    }
  ],
  "analysis": {
    "mainWeakness": "${focusTopic}",
    "reason": "Why this plan targets this topic.",
    "expectedOutcome": "What improves after completing the chain.",
    "risk": "What can go wrong.",
    "adjustmentAdvice": "How to adjust if user struggles."
  }
}

Allowed categories:
dsa, development, core, resume, system-design, mixed

Allowed task types:
article, practice, video, contest, revision, project, theory, implementation, leetcode, codeforces, debugging, mock-interview, project-build, resume-improvement, core-cs, system-design, contest-upsolve

Known useful links you can use:
- Striver A2Z DSA Sheet: https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/
- Striver SDE Sheet: https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/
- CP31 Sheet: https://www.tle-eliminators.com/cp-sheet
- LeetCode Problemset: https://leetcode.com/problemset/
- LeetCode Graph tag: https://leetcode.com/tag/graph/
- LeetCode Dynamic Programming tag: https://leetcode.com/tag/dynamic-programming/
- LeetCode Tree tag: https://leetcode.com/tag/tree/
- LeetCode Binary Search tag: https://leetcode.com/tag/binary-search/
- Codeforces Problemset: https://codeforces.com/problemset
- GFG DSA: https://www.geeksforgeeks.org/data-structures/
- GFG Algorithms: https://www.geeksforgeeks.org/fundamentals-of-algorithms/
- GFG Graph: https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/
- GFG Dynamic Programming: https://www.geeksforgeeks.org/dynamic-programming/
- GFG DBMS: https://www.geeksforgeeks.org/dbms/
- GFG Operating Systems: https://www.geeksforgeeks.org/operating-systems/
- GFG Computer Networks: https://www.geeksforgeeks.org/computer-network-tutorials/
- MDN JavaScript: https://developer.mozilla.org/en-US/docs/Web/JavaScript
- React Docs: https://react.dev/learn
- Node.js Docs: https://nodejs.org/en/learn
- Express Docs: https://expressjs.com/
- MongoDB Docs: https://www.mongodb.com/docs/
`;
};

const sanitizeResource = (resource, fallbackLabel, fallbackLink, fallbackPlatform) => ({
  label: resource?.label || resource?.title || fallbackLabel,
  link: resource?.link || resource?.url || fallbackLink,
  platform: resource?.platform || fallbackPlatform,
});

const inferFallbackResources = ({ title = "", category = "dsa", subTopic = "" }) => {
  const text = `${title} ${subTopic}`.toLowerCase();

  if (category === "development") {
    if (text.includes("react")) {
      return [
        {
          label: "Build this task using React official learning guide",
          link: "https://react.dev/learn",
          platform: "React Docs",
        },
      ];
    }

    if (text.includes("node") || text.includes("express") || text.includes("api")) {
      return [
        {
          label: "Implement backend/API task using Express docs",
          link: "https://expressjs.com/",
          platform: "Express Docs",
        },
      ];
    }

    if (text.includes("mongo")) {
      return [
        {
          label: "Practice MongoDB implementation from official docs",
          link: "https://www.mongodb.com/docs/",
          platform: "MongoDB Docs",
        },
      ];
    }

    return [
      {
        label: "Revise JavaScript fundamentals for this implementation task",
        link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        platform: "MDN",
      },
    ];
  }

  if (category === "core") {
    if (text.includes("dbms") || text.includes("database")) {
      return [
        {
          label: "Study DBMS theory from GeeksforGeeks",
          link: "https://www.geeksforgeeks.org/dbms/",
          platform: "GeeksforGeeks",
        },
      ];
    }

    if (text.includes("os") || text.includes("operating")) {
      return [
        {
          label: "Study Operating Systems theory from GeeksforGeeks",
          link: "https://www.geeksforgeeks.org/operating-systems/",
          platform: "GeeksforGeeks",
        },
      ];
    }

    if (text.includes("network")) {
      return [
        {
          label: "Study Computer Networks from GeeksforGeeks",
          link: "https://www.geeksforgeeks.org/computer-network-tutorials/",
          platform: "GeeksforGeeks",
        },
      ];
    }

    return [
      {
        label: "Study core CS theory from GeeksforGeeks",
        link: "https://www.geeksforgeeks.org/computer-science-projects/",
        platform: "GeeksforGeeks",
      },
    ];
  }

  if (text.includes("graph") || text.includes("bfs") || text.includes("dfs")) {
    return [
      {
        label: "Read graph theory from GFG",
        link: "https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/",
        platform: "GeeksforGeeks",
      },
      {
        label: "Solve graph problems from LeetCode tag",
        link: "https://leetcode.com/tag/graph/",
        platform: "LeetCode",
      },
      {
        label: "Practice graph section from Striver A2Z",
        link: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
        platform: "Striver",
      },
    ];
  }

  if (text.includes("dp") || text.includes("dynamic")) {
    return [
      {
        label: "Read Dynamic Programming theory from GFG",
        link: "https://www.geeksforgeeks.org/dynamic-programming/",
        platform: "GeeksforGeeks",
      },
      {
        label: "Solve DP problems from LeetCode tag",
        link: "https://leetcode.com/tag/dynamic-programming/",
        platform: "LeetCode",
      },
      {
        label: "Practice DP section from Striver A2Z",
        link: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
        platform: "Striver",
      },
    ];
  }

  if (text.includes("tree") || text.includes("binary tree")) {
    return [
      {
        label: "Solve Tree problems from LeetCode tag",
        link: "https://leetcode.com/tag/tree/",
        platform: "LeetCode",
      },
      {
        label: "Practice Tree section from Striver A2Z",
        link: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
        platform: "Striver",
      },
    ];
  }

  if (text.includes("binary search")) {
    return [
      {
        label: "Solve Binary Search problems from LeetCode tag",
        link: "https://leetcode.com/tag/binary-search/",
        platform: "LeetCode",
      },
      {
        label: "Practice Binary Search from Striver A2Z",
        link: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
        platform: "Striver",
      },
    ];
  }

  if (text.includes("codeforces") || text.includes("contest") || text.includes("cp")) {
    return [
      {
        label: "Practice connected CP problems from CP31 Sheet",
        link: "https://www.tle-eliminators.com/cp-sheet",
        platform: "CP31",
      },
      {
        label: "Solve related problems from Codeforces Problemset",
        link: "https://codeforces.com/problemset",
        platform: "Codeforces",
      },
    ];
  }

  return [
    {
      label: "Practice this topic from Striver A2Z DSA Sheet",
      link: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
      platform: "Striver",
    },
    {
      label: "Solve related problems from LeetCode Problemset",
      link: "https://leetcode.com/problemset/",
      platform: "LeetCode",
    },
  ];
};

const sanitizeTask = ({ task, category, index, focusTopic }) => {
  const title = task.title || `Task ${index + 1}: Practice ${focusTopic}`;
  const subTopic = task.subTopic || task.topic || focusTopic;

  const fallbackResources = inferFallbackResources({
    title,
    category,
    subTopic,
  });

  const rawResources = Array.isArray(task.resources) && task.resources.length
    ? task.resources
    : fallbackResources;

  const resources = rawResources
    .map((resource, resourceIndex) =>
      sanitizeResource(
        resource,
        fallbackResources[resourceIndex]?.label || `Resource for ${title}`,
        fallbackResources[resourceIndex]?.link || "https://leetcode.com/problemset/",
        fallbackResources[resourceIndex]?.platform || "LeetCode"
      )
    )
    .filter((resource) => resource.link);

  return {
    title,
    description: task.description || `Complete this connected step for ${subTopic}.`,
    estimated_time: task.estimated_time || task.estimatedTime || "45 min",
    effortMinutes: Number(task.effortMinutes || task.effort_minutes || 45),
    category: normalizeCategory(task.category || category),
    type: task.type || task.taskType || (index === 0 ? "theory" : "leetcode"),
    priority: task.priority || (index <= 2 ? "high" : "medium"),
    subTopic,
    whyThisTask:
      task.whyThisTask ||
      task.why ||
      `This is step ${index + 1} in the connected chain for ${subTopic}.`,
    successCriteria:
      task.successCriteria ||
      task.success_criteria ||
      "Complete the task and write short mistake notes.",
    resources,
  };
};

const sanitizeRoadmap = ({
  result,
  category,
  weaknesses,
  targetRole,
  targetCompany,
  timelineDays,
  intensity,
  mode,
}) => {
  const fallback = makeFallbackRoadmap({
    category,
    weaknesses,
    targetRole,
    targetCompany,
    timelineDays,
    intensity,
    mode,
  });

  if (!result || typeof result !== "object") {
    return fallback;
  }

  const taskLimit = getTaskLimit({ mode, intensity });
  const focusTopic = result.focusTopic || fallback.focusTopic;

  let rawTasks = [];

  if (Array.isArray(result.tasks) && result.tasks.length > 0) {
    rawTasks = result.tasks;
  } else if (Array.isArray(result.dailyPlan) && result.dailyPlan.length > 0) {
    rawTasks = result.dailyPlan.flatMap((day) =>
      Array.isArray(day.tasks) ? day.tasks : []
    );
  } else if (Array.isArray(result.subTopics) && result.subTopics.length > 0) {
    rawTasks = result.subTopics.flatMap((subTopic) => {
      const theoryTask = subTopic.gfgLink
        ? [
            {
              title: `Study theory of ${subTopic.name}`,
              description: `Read and understand ${subTopic.name}.`,
              type: "theory",
              priority: "high",
              subTopic: subTopic.name,
              resources: [
                {
                  label: `Read GFG theory for ${subTopic.name}`,
                  link: subTopic.gfgLink,
                  platform: "GeeksforGeeks",
                },
              ],
            },
          ]
        : [];

      const practiceTasks = Array.isArray(subTopic.practiceSet)
        ? subTopic.practiceSet.slice(0, 2).map((problem) => ({
            title: `Solve ${problem.title}`,
            description: `Practice ${subTopic.name} using this selected problem/sheet link.`,
            type: problem.platform === "Codeforces" ? "codeforces" : "leetcode",
            priority: problem.difficulty === "Hard" ? "high" : "medium",
            subTopic: subTopic.name,
            resources: [
              {
                label: `Solve ${problem.title}`,
                link: problem.link,
                platform: problem.platform || "LeetCode",
              },
            ],
          }))
        : [];

      return [...theoryTask, ...practiceTasks];
    });
  }

  if (!rawTasks.length) {
    rawTasks = fallback.tasks;
  }

  const sanitizedTasks = rawTasks
    .slice(0, taskLimit)
    .map((task, index) =>
      sanitizeTask({
        task,
        category,
        index,
        focusTopic,
      })
    );

  return {
    focusTopic,
    description:
      result.description ||
      fallback.description ||
      `Compact connected study chain for ${focusTopic}.`,
    roadmap:
      Array.isArray(result.roadmap) && result.roadmap.length
        ? result.roadmap.slice(0, 5)
        : fallback.roadmap,
    subTopics:
      Array.isArray(result.subTopics) && result.subTopics.length
        ? result.subTopics.slice(0, 3)
        : fallback.subTopics,
    dailyPlan: [
      {
        day: 1,
        date: "",
        title: `${focusTopic} connected mission`,
        focus: focusTopic,
        estimatedMinutes: sanitizedTasks.reduce(
          (sum, task) => sum + Number(task.effortMinutes || 45),
          0
        ),
        tasks: sanitizedTasks,
      },
    ],
    tasks: sanitizedTasks,
    analysis: result.analysis || fallback.analysis,
  };
};

exports.generateStudyRoadmap = async (
  category,
  weaknesses = [],
  codingStats = {},
  options = {}
) => {
  const normalizedCategory = normalizeCategory(category);
  const targetRole = options.targetRole || "SDE Intern";
  const targetCompany = options.targetCompany || "";
  const timelineDays = clampTimelineDays(options.timelineDays || 7);
  const intensity = normalizeIntensity(options.intensity || "medium");
  const mode = options.mode || "roadmap";

  try {
    const result = await runJsonLLM({
      systemPrompt,
      userPrompt: buildRoadmapPrompt({
        category: normalizedCategory,
        weaknesses,
        codingStats,
        options: {
          ...options,
          targetRole,
          targetCompany,
          timelineDays,
          intensity,
          mode,
        },
      }),
      temperature: 0.12,
    });

    return sanitizeRoadmap({
      result,
      category: normalizedCategory,
      weaknesses,
      targetRole,
      targetCompany,
      timelineDays,
      intensity,
      mode,
    });
  } catch (error) {
    console.error("AI Roadmap Generation Failed:", error.message);

    return makeFallbackRoadmap({
      category: normalizedCategory,
      weaknesses,
      targetRole,
      targetCompany,
      timelineDays,
      intensity,
      mode,
    });
  }
};

exports.generateStudyTasks = async (
  category,
  weaknesses = [],
  codingStats = {},
  options = {}
) => {
  return exports.generateStudyRoadmap(category, weaknesses, codingStats, options);
};