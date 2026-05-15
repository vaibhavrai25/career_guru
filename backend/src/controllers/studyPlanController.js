const StudyPlan = require("../models/StudyPlan");
const StudyTask = require("../models/StudyTask");
const StudyTopic = require("../models/StudyTopic");
const CodingProfile = require("../models/CodingProfile");
const aiService = require("../services/platforms/aiservice");

const CATEGORIES = [
  "dsa",
  "development",
  "core",
  "resume",
  "system-design",
  "mixed",
];

const todayString = () => new Date().toISOString().split("T")[0];

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const toDateString = (date) => new Date(date).toISOString().split("T")[0];

const getWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(now, diff);
};

const getWeekRange = () => {
  const start = getWeekStart();
  const end = addDays(start, 6);

  return {
    start: toDateString(start),
    end: toDateString(end),
  };
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

const normalizeCategory = (category) => {
  const clean = String(category || "dsa").toLowerCase().trim();
  return CATEGORIES.includes(clean) ? clean : "dsa";
};

const normalizePriority = (priority) => {
  const clean = String(priority || "medium").toLowerCase().trim();
  return ["high", "medium", "low"].includes(clean) ? clean : "medium";
};

const normalizeTaskType = (type) => {
  const clean = String(type || "practice").toLowerCase().trim();

  const allowed = [
    "article",
    "practice",
    "video",
    "contest",
    "revision",
    "project",
    "theory",
    "implementation",
    "leetcode",
    "codeforces",
    "debugging",
    "mock-interview",
    "project-build",
    "resume-improvement",
    "core-cs",
    "system-design",
    "contest-upsolve",
  ];

  return allowed.includes(clean) ? clean : "practice";
};

const parseEffortMinutes = (estimatedTime) => {
  const text = String(estimatedTime || "").toLowerCase();
  const numbers = text.match(/\d+/g);

  if (!numbers || !numbers.length) return 30;

  if (numbers.length === 1) return Number(numbers[0]);

  return Math.round(
    numbers.map(Number).reduce((sum, value) => sum + value, 0) / numbers.length
  );
};

const getTaskLimit = ({ mode = "roadmap", intensity = "medium" }) => {
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

const getTopicWiseEntries = (platformData) => {
  const topicWise = toPlainObject(platformData?.topicWise);

  return Object.entries(topicWise)
    .map(([topic, count]) => ({
      topic: String(topic || "").toLowerCase().trim(),
      count: Number(count || 0),
    }))
    .filter((item) => item.topic);
};

const collectTopicStats = (coding) => {
  const platforms = ["leetcode", "codeforces", "codechef"];
  const stats = {};

  platforms.forEach((platform) => {
    const entries = getTopicWiseEntries(coding?.[platform]);

    entries.forEach(({ topic, count }) => {
      stats[topic] = (stats[topic] || 0) + count;
    });
  });

  return stats;
};

const identifyWeaknesses = (coding) => {
  const stats = collectTopicStats(coding);

  const entries = Object.entries(stats)
    .filter(([, count]) => Number(count || 0) >= 0)
    .sort((a, b) => a[1] - b[1]);

  if (!entries.length) {
    return [
      {
        topic: "general programming",
        count: 0,
        severity: "medium",
        reason: "No platform topic data found yet. Sync coding platforms first.",
      },
    ];
  }

  return entries.slice(0, 5).map(([topic, count]) => ({
    topic,
    count,
    severity: count <= 2 ? "high" : count <= 5 ? "medium" : "low",
    reason:
      count <= 2
        ? `Very low solved count in ${topic}.`
        : count <= 5
        ? `Needs more consistent practice in ${topic}.`
        : `Still weaker compared with stronger topics.`,
  }));
};

const getStrongestTopics = (coding) => {
  const stats = collectTopicStats(coding);

  return Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({
      topic,
      count,
    }));
};

const getDifficultySignals = (coding) => {
  const platforms = ["leetcode", "codeforces", "codechef"];

  return platforms.reduce(
    (acc, platform) => {
      acc.easy += Number(coding?.[platform]?.easy || 0);
      acc.medium += Number(coding?.[platform]?.medium || 0);
      acc.hard += Number(coding?.[platform]?.hard || 0);
      acc.totalSolved += Number(coding?.[platform]?.totalSolved || 0);
      return acc;
    },
    {
      easy: 0,
      medium: 0,
      hard: 0,
      totalSolved: 0,
    }
  );
};

const buildReadinessScores = (tasks, coding) => {
  const difficulty = getDifficultySignals(coding);

  const progressByCategory = CATEGORIES.reduce((acc, category) => {
    const categoryTasks = tasks.filter((task) => task.category === category);
    const completed = categoryTasks.filter((task) => task.completed).length;

    acc[category] = categoryTasks.length
      ? Math.round((completed / categoryTasks.length) * 100)
      : 0;

    return acc;
  }, {});

  const dsaBase = Math.min(100, Math.round(difficulty.totalSolved / 6));
  const hardBoost = Math.min(20, difficulty.hard * 2);

  const dsa = Math.min(
    100,
    Math.round(dsaBase * 0.6 + progressByCategory.dsa * 0.3 + hardBoost * 0.1)
  );

  const development = Math.min(
    100,
    Math.round(
      (progressByCategory.development || 0) * 0.75 +
        (progressByCategory["system-design"] || 0) * 0.25
    )
  );

  const core = Math.min(100, progressByCategory.core || 0);
  const resume = Math.min(100, progressByCategory.resume || 0);

  const interview = Math.round(
    dsa * 0.35 + development * 0.25 + core * 0.2 + resume * 0.2
  );

  const overall = Math.round((dsa + development + core + resume + interview) / 5);

  return {
    dsa,
    development,
    core,
    resume,
    interview,
    overall,
  };
};

const getWeeklyAnalytics = (tasks) => {
  const { start, end } = getWeekRange();

  const weekTasks = tasks.filter((task) => {
    return task.date >= start && task.date <= end;
  });

  const completed = weekTasks.filter((task) => task.completed).length;
  const total = weekTasks.length;

  const totalMinutes = weekTasks.reduce(
    (sum, task) =>
      sum + Number(task.effortMinutes || parseEffortMinutes(task.estimated_time)),
    0
  );

  const completedMinutes = weekTasks
    .filter((task) => task.completed)
    .reduce(
      (sum, task) =>
        sum + Number(task.effortMinutes || parseEffortMinutes(task.estimated_time)),
      0
    );

  return {
    start,
    end,
    totalTasks: total,
    completedTasks: completed,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    plannedMinutes: totalMinutes,
    completedMinutes,
  };
};

const getTodayMission = (tasks) => {
  const today = todayString();

  const todayTasks = tasks.filter((task) => task.date === today);
  const highPriority = todayTasks.filter((task) => task.priority === "high");
  const pending = todayTasks.filter((task) => !task.completed);

  const estimatedMinutes = todayTasks.reduce(
    (sum, task) =>
      sum + Number(task.effortMinutes || parseEffortMinutes(task.estimated_time)),
    0
  );

  return {
    date: today,
    totalTasks: todayTasks.length,
    pendingTasks: pending.length,
    completedTasks: todayTasks.length - pending.length,
    highPriorityTasks: highPriority.length,
    estimatedMinutes,
    focusTask: pending[0] || null,
    tasks: todayTasks,
  };
};

const inferFallbackResources = ({ title = "", category = "dsa", subTopic = "" }) => {
  const text = `${title} ${subTopic}`.toLowerCase();

  if (category === "development") {
    if (text.includes("react")) {
      return [
        {
          label: "Use React official docs for this implementation task",
          link: "https://react.dev/learn",
          platform: "React Docs",
        },
      ];
    }

    if (text.includes("node") || text.includes("express") || text.includes("api")) {
      return [
        {
          label: "Use Express official docs for backend/API task",
          link: "https://expressjs.com/",
          platform: "Express Docs",
        },
      ];
    }

    if (text.includes("mongo")) {
      return [
        {
          label: "Use MongoDB docs for database implementation",
          link: "https://www.mongodb.com/docs/",
          platform: "MongoDB Docs",
        },
      ];
    }

    return [
      {
        label: "Revise JavaScript fundamentals on MDN",
        link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        platform: "MDN",
      },
    ];
  }

  if (category === "core") {
    if (text.includes("dbms") || text.includes("database")) {
      return [
        {
          label: "Study DBMS from GeeksforGeeks",
          link: "https://www.geeksforgeeks.org/dbms/",
          platform: "GeeksforGeeks",
        },
      ];
    }

    if (text.includes("os") || text.includes("operating")) {
      return [
        {
          label: "Study Operating Systems from GeeksforGeeks",
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
  }

  if (text.includes("graph") || text.includes("bfs") || text.includes("dfs")) {
    return [
      {
        label: "Read graph theory from GeeksforGeeks",
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
        label: "Read Dynamic Programming theory from GeeksforGeeks",
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

  if (text.includes("tree")) {
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

  if (text.includes("cp") || text.includes("codeforces") || text.includes("contest")) {
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

const normalizeResources = (resources, context = {}) => {
  const fallback = inferFallbackResources(context);

  const source = Array.isArray(resources) && resources.length > 0 ? resources : fallback;

  return source
    .map((resource, index) => ({
      label:
        resource.label ||
        resource.title ||
        fallback[index]?.label ||
        `Resource for ${context.title || "task"}`,
      link:
        resource.link ||
        resource.url ||
        fallback[index]?.link ||
        "https://leetcode.com/problemset/",
      platform:
        resource.platform ||
        fallback[index]?.platform ||
        "LeetCode",
    }))
    .filter((resource) => resource.link);
};

const taskFromAIItem = ({ item, category, date, fallbackTopic, index }) => {
  const title = item.title || item.name || `Practice ${fallbackTopic}`;
  const subTopic = item.subTopic || item.topic || fallbackTopic || "";

  return {
    title,
    description:
      item.description ||
      item.reason ||
      item.why ||
      `Complete this connected step for ${subTopic || fallbackTopic}.`,
    estimated_time:
      item.estimated_time || item.estimatedTime || item.time || "45 min",
    effortMinutes: Number(
      item.effortMinutes ||
        item.effort_minutes ||
        parseEffortMinutes(item.estimated_time || item.estimatedTime || item.time)
    ),
    category: normalizeCategory(item.category || category),
    source: "ai",
    type: normalizeTaskType(item.type || item.taskType || (index === 0 ? "theory" : "leetcode")),
    priority: normalizePriority(item.priority || (index <= 2 ? "high" : "medium")),
    date: item.date || date,
    resources: normalizeResources(item.resources, {
      title,
      category: normalizeCategory(item.category || category),
      subTopic,
    }),
    subTopic,
    whyThisTask:
      item.whyThisTask ||
      item.why ||
      item.reason ||
      `This is step ${index + 1} of a connected study chain for ${subTopic || fallbackTopic}.`,
    successCriteria:
      item.successCriteria ||
      item.success_criteria ||
      "Complete the task and write short mistake notes.",
    status: "todo",
    completed: false,
  };
};

const dedupeTasks = (tasks) => {
  const seen = new Set();

  return tasks.filter((task) => {
    const key = `${task.title}`.toLowerCase().trim();

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

const normalizeAIOutputToTasks = ({
  aiOutput,
  category,
  weakTopics,
  mode = "roadmap",
  intensity = "medium",
}) => {
  const today = todayString();
  const fallbackTopic = weakTopics?.[0]?.topic || weakTopics?.[0] || category;
  const limit = getTaskLimit({ mode, intensity });

  let rawTasks = [];

  if (Array.isArray(aiOutput)) {
    rawTasks = aiOutput;
  } else if (aiOutput && typeof aiOutput === "object") {
    if (Array.isArray(aiOutput.tasks) && aiOutput.tasks.length > 0) {
      rawTasks = aiOutput.tasks;
    } else if (Array.isArray(aiOutput.dailyPlan) && aiOutput.dailyPlan.length > 0) {
      rawTasks = aiOutput.dailyPlan.flatMap((dayItem) =>
        Array.isArray(dayItem.tasks) ? dayItem.tasks : []
      );
    } else if (Array.isArray(aiOutput.subTopics) && aiOutput.subTopics.length > 0) {
      rawTasks = aiOutput.subTopics.flatMap((subTopic) => {
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
              description: `Practice ${subTopic.name} using this selected sheet/platform link.`,
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
  }

  if (!rawTasks.length) return [];

  const normalized = rawTasks.map((item, index) =>
    taskFromAIItem({
      item,
      category,
      date: today,
      fallbackTopic,
      index,
    })
  );

  return dedupeTasks(normalized).slice(0, limit);
};

const syncStudyTopicsFromPlan = async ({ userId, plan }) => {
  if (!plan?._id || !Array.isArray(plan.subTopics)) return;

  await StudyTopic.deleteMany({
    userId,
    studyPlanId: plan._id,
  });

  const topicDocs = plan.subTopics.map((topic) => {
    const totalTasks = Array.isArray(topic.practiceSet)
      ? topic.practiceSet.length + (topic.gfgLink ? 1 : 0)
      : topic.gfgLink
      ? 1
      : 0;

    const completedProblems = Array.isArray(topic.practiceSet)
      ? topic.practiceSet.filter((problem) => problem.completed).length
      : 0;

    return {
      userId,
      studyPlanId: plan._id,
      name: topic.name,
      category: plan.category || "dsa",
      totalTasks,
      completedTasks: completedProblems,
    };
  });

  if (topicDocs.length > 0) {
    await StudyTopic.insertMany(topicDocs);
  }
};

exports.getOrCreateStudyPlan = async (req, res) => {
  try {
    let plan = await StudyPlan.findOne({
      userId: req.user._id,
      isActive: true,
    }).sort({ updatedAt: -1 });

    if (!plan) {
      plan = await StudyPlan.create({
        userId: req.user._id,
        focusTopic: "General Preparation",
        description: "Personalized study roadmap initialized.",
        roadmap: [
          "Diagnose weak areas",
          "Practice consistently",
          "Review progress",
        ],
        category: "mixed",
        targetRole: "SDE Intern",
        targetCompany: "",
        timelineDays: 7,
        intensity: "medium",
        isActive: true,
      });
    }

    return res.status(200).json(plan);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch study plan",
      error: error.message,
    });
  }
};

exports.getStudyCommandCenter = async (req, res) => {
  try {
    const [plan, tasks, coding] = await Promise.all([
      StudyPlan.findOne({
        userId: req.user._id,
        isActive: true,
      }).sort({ updatedAt: -1 }),
      StudyTask.find({ userId: req.user._id }).sort({ date: -1 }),
      CodingProfile.findOne({ userId: req.user._id }),
    ]);

    const todayMission = getTodayMission(tasks);
    const weeklyAnalytics = getWeeklyAnalytics(tasks);
    const readiness = buildReadinessScores(tasks, coding);
    const weaknesses = identifyWeaknesses(coding);
    const strongestTopics = getStrongestTopics(coding);

    const missedTasks = tasks.filter(
      (task) => task.date < todayString() && !task.completed
    );

    const completedTasks = tasks.filter((task) => task.completed).length;

    return res.status(200).json({
      plan,
      todayMission,
      weeklyAnalytics,
      readiness,
      weaknesses,
      strongestTopics,
      taskStats: {
        total: tasks.length,
        completed: completedTasks,
        pending: tasks.length - completedTasks,
        missed: missedTasks.length,
        completionRate: tasks.length
          ? Math.round((completedTasks / tasks.length) * 100)
          : 0,
      },
      missedTasks: missedTasks.slice(0, 10),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load study command center",
      error: error.message,
    });
  }
};

exports.getWeaknessIntelligence = async (req, res) => {
  try {
    const coding = await CodingProfile.findOne({ userId: req.user._id });

    const weaknesses = identifyWeaknesses(coding);
    const strongestTopics = getStrongestTopics(coding);
    const difficultySignals = getDifficultySignals(coding);

    return res.status(200).json({
      weaknesses,
      strongestTopics,
      difficultySignals,
      recommendation:
        weaknesses[0]?.severity === "high"
          ? `Start with ${weaknesses[0].topic}. It has the weakest signal right now.`
          : "Maintain consistency and increase medium-level practice.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate weakness intelligence",
      error: error.message,
    });
  }
};

exports.generateAIRecommendations = async (req, res) => {
  try {
    const {
      category = "dsa",
      targetRole = "SDE Intern",
      targetCompany = "",
      timelineDays = 7,
      intensity = "medium",
    } = req.body;

    const normalizedCategory = normalizeCategory(category);

    const coding = await CodingProfile.findOne({ userId: req.user._id });
    const weaknesses = identifyWeaknesses(coding);
    const weakTopicNames = weaknesses.map((item) => item.topic);

    const aiOutput = await aiService.generateStudyTasks(
      normalizedCategory,
      weakTopicNames,
      coding || {},
      {
        targetRole,
        targetCompany,
        timelineDays,
        intensity,
        mode: "roadmap",
      }
    );

    const normalizedTasks = normalizeAIOutputToTasks({
      aiOutput,
      category: normalizedCategory,
      weakTopics: weaknesses,
      mode: "roadmap",
      intensity,
    });

    if (!normalizedTasks.length) {
      return res.status(500).json({
        message: "AI service returned invalid task format",
      });
    }

    const savedTasks = await StudyTask.insertMany(
      normalizedTasks.map((task) => ({
        ...task,
        userId: req.user._id,
      }))
    );

    if (aiOutput && typeof aiOutput === "object" && !Array.isArray(aiOutput)) {
      const updatedPlan = await StudyPlan.findOneAndUpdate(
        {
          userId: req.user._id,
          isActive: true,
        },
        {
          $set: {
            userId: req.user._id,
            focusTopic:
              aiOutput.focusTopic ||
              weakTopicNames[0] ||
              normalizedCategory ||
              "General Preparation",
            description:
              aiOutput.description ||
              `AI-generated connected roadmap for ${targetRole}.`,
            roadmap: Array.isArray(aiOutput.roadmap)
              ? aiOutput.roadmap.slice(0, 5)
              : [
                  "Understand concept",
                  "Solve warm-up problems",
                  "Solve medium practice",
                  "Review mistakes",
                ],
            subTopics: Array.isArray(aiOutput.subTopics)
              ? aiOutput.subTopics.slice(0, 3)
              : [],
            category: normalizedCategory,
            targetRole,
            targetCompany,
            timelineDays: Number(timelineDays || 7),
            intensity,
            isActive: true,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );

      await syncStudyTopicsFromPlan({
        userId: req.user._id,
        plan: updatedPlan,
      });
    }

    return res.status(201).json(savedTasks);
  } catch (error) {
    console.error("AI Study Plan Error:", error.message);

    return res.status(500).json({
      message: "AI study plan generation failed",
      error: error.message,
    });
  }
};

exports.generateMissionPlan = async (req, res) => {
  try {
    const {
      category = "mixed",
      targetRole = "SDE Intern",
      targetCompany = "",
      timelineDays = 7,
      intensity = "medium",
    } = req.body;

    const normalizedCategory = normalizeCategory(category);
    const coding = await CodingProfile.findOne({ userId: req.user._id });
    const weaknesses = identifyWeaknesses(coding);
    const weakTopicNames = weaknesses.map((item) => item.topic);

    const aiOutput = await aiService.generateStudyTasks(
      normalizedCategory,
      weakTopicNames,
      coding || {},
      {
        targetRole,
        targetCompany,
        timelineDays,
        intensity,
        mode: "mission-plan",
      }
    );

    const normalizedTasks = normalizeAIOutputToTasks({
      aiOutput,
      category: normalizedCategory,
      weakTopics: weaknesses,
      mode: "mission-plan",
      intensity,
    });

    const savedTasks = normalizedTasks.length
      ? await StudyTask.insertMany(
          normalizedTasks.map((task) => ({
            ...task,
            userId: req.user._id,
          }))
        )
      : [];

    const plan = await StudyPlan.findOneAndUpdate(
      {
        userId: req.user._id,
        isActive: true,
      },
      {
        $set: {
          userId: req.user._id,
          focusTopic:
            aiOutput?.focusTopic ||
            weakTopicNames[0] ||
            "Internship Preparation",
          description:
            aiOutput?.description ||
            `Compact connected mission plan for ${targetRole}${
              targetCompany ? ` at ${targetCompany}` : ""
            }.`,
          roadmap: Array.isArray(aiOutput?.roadmap)
            ? aiOutput.roadmap.slice(0, 5)
            : [
                "Learn theory",
                "Do warm-up practice",
                "Solve medium problems",
                "Revise mistakes",
              ],
          subTopics: Array.isArray(aiOutput?.subTopics)
            ? aiOutput.subTopics.slice(0, 3)
            : [],
          dailyMissions: Array.isArray(aiOutput?.dailyPlan)
            ? aiOutput.dailyPlan.slice(0, 1)
            : [],
          category: normalizedCategory,
          targetRole,
          targetCompany,
          timelineDays: Number(timelineDays || 7),
          intensity,
          isActive: true,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    await syncStudyTopicsFromPlan({
      userId: req.user._id,
      plan,
    });

    return res.status(201).json({
      message: "Mission plan generated successfully",
      plan,
      tasks: savedTasks,
      weaknesses,
    });
  } catch (error) {
    console.error("Mission Plan Error:", error.message);

    return res.status(500).json({
      message: "Mission plan generation failed",
      error: error.message,
    });
  }
};

exports.addTask = async (req, res) => {
  try {
    const {
      title,
      description = "",
      estimated_time = "30 min",
      effortMinutes,
      category = "dsa",
      type = "practice",
      priority = "medium",
      resources = [],
      date,
      subTopic = "",
      goal = "",
      targetRole = "",
      targetCompany = "",
      whyThisTask = "",
      successCriteria = "",
    } = req.body;

    if (!title || title.trim().length < 2) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    const task = await StudyTask.create({
      userId: req.user._id,
      title: title.trim(),
      description,
      estimated_time,
      effortMinutes: Number(effortMinutes || parseEffortMinutes(estimated_time)),
      category: normalizeCategory(category),
      type: normalizeTaskType(type),
      priority: normalizePriority(priority),
      source: "user",
      completed: false,
      status: "todo",
      date: date || todayString(),
      resources: normalizeResources(resources, {
        title,
        category: normalizeCategory(category),
        subTopic,
      }),
      subTopic,
      goal,
      targetRole,
      targetCompany,
      whyThisTask,
      successCriteria,
    });

    return res.status(201).json(task);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add task",
      error: error.message,
    });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { date, category, status, source, limit = 200 } = req.query;

    const filter = {
      userId: req.user._id,
    };

    if (date) filter.date = date;
    if (category) filter.category = normalizeCategory(category);
    if (status) filter.status = status;
    if (source) filter.source = source;

    const tasks = await StudyTask.find(filter)
      .sort({ date: -1, priority: 1, createdAt: -1 })
      .limit(Number(limit || 200));

    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "description",
      "estimated_time",
      "effortMinutes",
      "category",
      "type",
      "priority",
      "resources",
      "date",
      "subTopic",
      "goal",
      "targetRole",
      "targetCompany",
      "whyThisTask",
      "successCriteria",
      "status",
      "completed",
    ];

    const update = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    });

    if (update.category) update.category = normalizeCategory(update.category);
    if (update.type) update.type = normalizeTaskType(update.type);
    if (update.priority) update.priority = normalizePriority(update.priority);
    if (update.resources) {
      update.resources = normalizeResources(update.resources, {
        title: update.title,
        category: update.category,
        subTopic: update.subTopic,
      });
    }

    if (update.completed === true) {
      update.status = "completed";
      update.completedAt = new Date();
    }

    if (update.status === "completed") {
      update.completed = true;
      update.completedAt = new Date();
    }

    if (update.status && update.status !== "completed") {
      update.completed = false;
      update.completedAt = null;
    }

    const task = await StudyTask.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      {
        $set: update,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json(task);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update task",
      error: error.message,
    });
  }
};

exports.toggleTask = async (req, res) => {
  try {
    const task = await StudyTask.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    task.completed = !task.completed;
    task.status = task.completed ? "completed" : "todo";
    task.completedAt = task.completed ? new Date() : null;

    await task.save();

    return res.status(200).json(task);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update task",
      error: error.message,
    });
  }
};

exports.getTodayTasks = async (req, res) => {
  try {
    const today = todayString();

    const tasks = await StudyTask.find({
      userId: req.user._id,
      date: today,
    }).sort({ priority: 1, createdAt: -1 });

    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch today tasks",
      error: error.message,
    });
  }
};

exports.getTopicProgress = async (req, res) => {
  try {
    const tasks = await StudyTask.find({ userId: req.user._id });

    const progress = {};

    CATEGORIES.forEach((sector) => {
      const sectorTasks = tasks.filter((task) => task.category === sector);
      const completed = sectorTasks.filter((task) => task.completed).length;

      progress[sector] = sectorTasks.length
        ? Math.round((completed / sectorTasks.length) * 100)
        : 0;
    });

    return res.status(200).json(progress);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to calculate progress",
      error: error.message,
    });
  }
};

exports.rescheduleMissedTasks = async (req, res) => {
  try {
    const today = todayString();

    const { limit = 10, priority = "high" } = req.body;

    const missedTasks = await StudyTask.find({
      userId: req.user._id,
      date: { $lt: today },
      completed: false,
    })
      .sort({ date: 1, priority: 1 })
      .limit(Number(limit || 10));

    const operations = missedTasks.map((task) => ({
      updateOne: {
        filter: {
          _id: task._id,
          userId: req.user._id,
        },
        update: {
          $set: {
            date: today,
            priority: normalizePriority(priority),
            status: "todo",
          },
          $inc: {
            rescheduleCount: 1,
          },
        },
      },
    }));

    if (operations.length > 0) {
      await StudyTask.bulkWrite(operations);
    }

    const updatedTasks = await StudyTask.find({
      userId: req.user._id,
      date: today,
    }).sort({ priority: 1, createdAt: -1 });

    return res.status(200).json({
      message: `${missedTasks.length} missed tasks moved to today`,
      movedCount: missedTasks.length,
      tasks: updatedTasks,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to reschedule missed tasks",
      error: error.message,
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const deleted = await StudyTask.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete task",
      error: error.message,
    });
  }
};