const StudyPlan = require("../models/StudyPlan");
const StudyTask = require("../models/StudyTask");
const CodingProfile = require("../models/CodingProfile");
const aiService = require("../services/platforms/aiservice");

const identifyWeaknesses = (coding) => {
  const platforms = ["leetcode", "codeforces", "codechef"];
  const stats = {};

  platforms.forEach((platform) => {
    const topicWise = coding?.[platform]?.topicWise;

    if (!topicWise) return;

    Object.entries(topicWise).forEach(([tag, count]) => {
      const key = tag.toLowerCase().trim();
      stats[key] = (stats[key] || 0) + Number(count || 0);
    });
  });

  const weaknesses = Object.entries(stats)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([topic]) => topic);

  return weaknesses.length ? weaknesses : ["general programming"];
};

exports.getOrCreateStudyPlan = async (req, res) => {
  try {
    let plan = await StudyPlan.findOne({ userId: req.user._id });

    if (!plan) {
      plan = await StudyPlan.create({
        userId: req.user._id,
        focusTopic: "General Preparation",
        description: "Personalized study roadmap initialized.",
        roadmap: ["Diagnose weak areas", "Practice consistently", "Review progress"],
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

exports.generateAIRecommendations = async (req, res) => {
  try {
    const { category = "dsa" } = req.body;

    const coding = await CodingProfile.findOne({ userId: req.user._id });
    const weakTopics = identifyWeaknesses(coding);

    const aiTasksData = await aiService.generateStudyTasks(
      category,
      weakTopics,
      coding || {}
    );

    if (!Array.isArray(aiTasksData)) {
      return res.status(500).json({
        message: "AI service returned invalid task format",
      });
    }

    const today = new Date().toISOString().split("T")[0];

    const savedTasks = await Promise.all(
      aiTasksData.map((item) =>
        StudyTask.create({
          userId: req.user._id,
          title: item.title || "Untitled task",
          description: item.description || "",
          estimated_time: item.estimated_time || "30-45 min",
          category,
          source: "ai",
          type: item.type || "practice",
          priority: item.priority || "medium",
          date: today,
          resources: Array.isArray(item.resources) ? item.resources : [],
        })
      )
    );

    return res.status(201).json(savedTasks);
  } catch (error) {
    console.error("AI Study Plan Error:", error.message);

    return res.status(500).json({
      message: "AI study plan generation failed",
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
      category = "dsa",
      type = "practice",
      priority = "medium",
      resources = [],
      date,
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
      category,
      type,
      priority,
      source: "user",
      completed: false,
      date: date || new Date().toISOString().split("T")[0],
      resources: Array.isArray(resources) ? resources : [],
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
    const tasks = await StudyTask.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch tasks",
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
    const today = new Date().toISOString().split("T")[0];

    const tasks = await StudyTask.find({
      userId: req.user._id,
      date: today,
    }).sort({ createdAt: -1 });

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

    const sectors = ["dsa", "development", "core"];
    const progress = {};

    sectors.forEach((sector) => {
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