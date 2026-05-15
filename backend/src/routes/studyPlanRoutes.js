const express = require("express");
const router = express.Router();

const {
  getOrCreateStudyPlan,
  getStudyCommandCenter,
  getWeaknessIntelligence,
  addTask,
  getTasks,
  updateTask,
  toggleTask,
  getTodayTasks,
  getTopicProgress,
  generateAIRecommendations,
  generateMissionPlan,
  rescheduleMissedTasks,
  deleteTask,
} = require("../controllers/studyPlanController");

const { protect } = require("../middlewares/authMiddleware");

router.get("/plan", protect, getOrCreateStudyPlan);
router.get("/command-center", protect, getStudyCommandCenter);
router.get("/weaknesses", protect, getWeaknessIntelligence);

router.get("/tasks", protect, getTasks);
router.get("/tasks/today", protect, getTodayTasks);
router.post("/tasks", protect, addTask);

router.patch("/tasks/missed/reschedule", protect, rescheduleMissedTasks);
router.patch("/tasks/:id", protect, updateTask);
router.patch("/tasks/:id/toggle", protect, toggleTask);
router.delete("/tasks/:id", protect, deleteTask);

router.post("/generate-ai", protect, generateAIRecommendations);
router.post("/generate-mission", protect, generateMissionPlan);

router.get("/progress", protect, getTopicProgress);

module.exports = router;