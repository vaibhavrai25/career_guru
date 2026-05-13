const express = require("express");
const router = express.Router();

const {
  getOrCreateStudyPlan,
  addTask,
  getTasks,
  toggleTask,
  getTodayTasks,
  getTopicProgress,
  generateAIRecommendations,
  deleteTask,
} = require("../controllers/studyPlanController");

const { protect } = require("../middlewares/authMiddleware");

router.get("/plan", protect, getOrCreateStudyPlan);

router.get("/tasks", protect, getTasks);
router.get("/tasks/today", protect, getTodayTasks);
router.post("/tasks", protect, addTask);
router.patch("/tasks/:id/toggle", protect, toggleTask);
router.delete("/tasks/:id", protect, deleteTask);

router.post("/generate-ai", protect, generateAIRecommendations);
router.get("/progress", protect, getTopicProgress);

module.exports = router;