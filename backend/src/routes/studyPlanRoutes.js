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

// Plan Management
router.get("/plan", protect, getOrCreateStudyPlan);

// Topics
router.post("/topic", protect, addTopic);
router.get("/topics/:planId", protect, getTopicProgress); // Matches frontend getStudyTopics

// Tasks
router.post("/task", protect, addTask);
router.get("/tasks/today", protect, getTodayTasks);
router.patch("/tasks/:id/toggle", protect, toggleTask); // Matches frontend toggleTask path

module.exports = router;