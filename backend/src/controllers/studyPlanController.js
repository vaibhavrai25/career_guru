const StudyPlan = require("../models/StudyPlan");
const StudyTopic = require("../models/StudyTopic");
const StudyTask = require("../models/StudyTask");

exports.getOrCreateStudyPlan = async (req, res) => {
  try {
    let plan = await StudyPlan.findOne({ userId: req.user._id });
    if (!plan) {
      plan = await StudyPlan.create({
        userId: req.user._id,
        focusTopic: "Initial Assessment",
        description: "Your AI mentor is analyzing your stats...",
        roadmap: ["Sync coding accounts", "Analyze weaknesses", "Generate first tasks"]
      });
    }
    res.json(plan);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.addTopic = async (req, res) => {
  const { studyPlanId, name } = req.body;
  try {
    if (!studyPlanId || !name) {
      return res.status(400).json({ message: "studyPlanId and name are required" });
    }

    const topic = await StudyTopic.create({
      studyPlanId,
      name,
    });

    res.status(201).json(topic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addTask = async (req, res) => {
  const { studyPlanId, topicId, title, date } = req.body;
  try {
    const task = await StudyTask.create({ userId: req.user._id, studyPlanId, topicId, title, date });
    await StudyTopic.findByIdAndUpdate(topicId, { $inc: { totalTasks: 1 } });
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.toggleTask = async (req, res) => {
  try {
    const task = await StudyTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.completed = !task.completed;
    await task.save();

    if (task.topicId) {
      await StudyTopic.findByIdAndUpdate(task.topicId, { $inc: { completedTasks: task.completed ? 1 : -1 } });
    }
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getTodayTasks = async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const tasks = await StudyTask.find({ userId: req.user._id, date: today }).populate("topicId", "name");
  res.json(tasks);
};

exports.getTopicProgress = async (req, res) => {
  const topics = await StudyTopic.find({ studyPlanId: req.params.planId });
  res.json(topics.map(t => ({
    id: t._id,
    name: t.name,
    progress: t.totalTasks === 0 ? 0 : Math.round((t.completedTasks / t.totalTasks) * 100)
  })));
};