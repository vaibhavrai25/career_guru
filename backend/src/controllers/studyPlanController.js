const StudyPlan = require("../models/StudyPlan");
const StudyTopic = require("../models/StudyTopic");
const StudyTask = require("../models/StudyTask");

/**
 * ======================================================
 * 1️⃣ Create or Get Active Study Plan
 * ======================================================
 */
exports.getOrCreateStudyPlan = async (req, res) => {
  let plan = await StudyPlan.findOne({ userId: req.user._id });

  if (!plan) {
    plan = await StudyPlan.create({
      userId: req.user._id,
      title: "Personalized Study Plan",
      lastGeneratedAt: new Date(),
    });
  }

  res.json(plan);
};

/**
 * ======================================================
 * 2️⃣ Add Topic to Study Plan
 * ======================================================
 */
exports.addTopic = async (req, res) => {
  const { studyPlanId, name } = req.body;

  if (!studyPlanId || !name) {
    return res.status(400).json({ message: "studyPlanId and name required" });
  }

  const topic = await StudyTopic.create({
    studyPlanId,
    name,
  });

  res.json(topic);
};

/**
 * ======================================================
 * 3️⃣ Add Task (Daily Checklist)
 * ======================================================
 */
exports.addTask = async (req, res) => {
  const { studyPlanId, topicId, title, date } = req.body;

  if (!studyPlanId || !topicId || !title || !date) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const task = await StudyTask.create({
    userId: req.user._id,
    studyPlanId,
    topicId,
    title,
    date, // YYYY-MM-DD
  });

  // update topic task count
  await StudyTopic.findByIdAndUpdate(topicId, {
    $inc: { totalTasks: 1 },
  });

  res.json(task);
};

/**
 * ======================================================
 * 4️⃣ Toggle Task Completion
 * ======================================================
 */
exports.toggleTask = async (req, res) => {
  const task = await StudyTask.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  task.completed = !task.completed;
  await task.save();

  await StudyTopic.findByIdAndUpdate(task.topicId, {
    $inc: { completedTasks: task.completed ? 1 : -1 },
  });

  res.json(task);
};

/**
 * ======================================================
 * 5️⃣ Get Today’s Tasks
 * ======================================================
 */
exports.getTodayTasks = async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const tasks = await StudyTask.find({
    userId: req.user._id,
    date: today,
  }).populate("topicId", "name");

  res.json(tasks);
};

/**
 * ======================================================
 * 6️⃣ Topic Progress (Progress Bars)
 * ======================================================
 */
exports.getTopicProgress = async (req, res) => {
  const topics = await StudyTopic.find({
    studyPlanId: req.params.planId,
  });

  const data = topics.map(t => ({
    id: t._id,
    name: t.name,
    totalTasks: t.totalTasks,
    completedTasks: t.completedTasks,
    progress:
      t.totalTasks === 0
        ? 0
        : Math.round((t.completedTasks / t.totalTasks) * 100),
  }));

  res.json(data);
};
