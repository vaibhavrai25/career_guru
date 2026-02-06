const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

const {
  getOrCreateStudyPlan,
  addTopic,
  addTask,
  toggleTask,
  getTodayTasks,
  getTopicProgress,
} = require("../controllers/studyPlanController");

// Study Plan
router.get("/", protect, getOrCreateStudyPlan);

// Topics
router.post("/topic", protect, addTopic);
router.get("/topics/:planId/progress", protect, getTopicProgress);

// Tasks
router.post("/task", protect, addTask);
router.get("/tasks/today", protect, getTodayTasks);
router.patch("/task/:id/toggle", protect, toggleTask);

module.exports = router;
