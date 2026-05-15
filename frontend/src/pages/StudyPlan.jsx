import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import {
  addTask,
  deleteTask,
  generateAIRecommendations,
  generateMissionPlan,
  getStudyCommandCenter,
  getTasks,
  getTopicProgress,
  rescheduleMissedTasks,
  toggleTask,
} from "../api/stats";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Code2,
  Cpu,
  ExternalLink,
  Flame,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  X,
  Zap,
} from "lucide-react";

const categories = [
  { key: "dsa", label: "DSA", icon: Code2 },
  { key: "development", label: "Development", icon: Cpu },
  { key: "core", label: "Core CS", icon: BookOpen },
  { key: "resume", label: "Resume", icon: ShieldCheck },
  { key: "system-design", label: "System Design", icon: Layers },
  { key: "mixed", label: "Mixed", icon: Sparkles },
];

const taskTypes = [
  "practice",
  "theory",
  "leetcode",
  "codeforces",
  "implementation",
  "revision",
  "project-build",
  "resume-improvement",
  "core-cs",
  "system-design",
  "contest-upsolve",
  "mock-interview",
];

const priorityStyles = {
  high: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-zinc-800 text-zinc-400 border-white/[0.05]",
};

const categoryStyles = {
  dsa: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  development: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  core: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  resume: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "system-design": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  mixed: "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

const todayString = () => new Date().toISOString().split("T")[0];

const formatDate = (dateString) => {
  if (!dateString) return "No date";

  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const getCategoryLabel = (key) =>
  categories.find((item) => item.key === key)?.label || key;

const getPriorityTone = (priority) =>
  priorityStyles[priority] || priorityStyles.medium;

const getCategoryTone = (category) =>
  categoryStyles[category] || categoryStyles.mixed;

const Pill = ({ children, tone = "gray" }) => {
  const tones = {
    gray: "bg-zinc-800 text-zinc-400 border-white/[0.05]",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${
        tones[tone] || tones.gray
      }`}
    >
      {children}
    </span>
  );
};

const MetricCard = ({ label, value, subtext, icon: Icon, tone = "blue" }) => {
  const colors = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    green: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <div className="rounded-3xl border border-white/[0.04] bg-zinc-900/40 p-5 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
            {label}
          </p>
          <p className="text-3xl text-white font-black italic tracking-tighter mt-2">
            {value}
          </p>
        </div>

        <div className={`p-3 rounded-2xl border ${colors[tone] || colors.blue}`}>
          <Icon size={18} />
        </div>
      </div>

      {subtext && <p className="text-[10px] text-zinc-600 mt-4">{subtext}</p>}
    </div>
  );
};

const ProgressBar = ({ value = 0, label }) => (
  <div>
    <div className="flex items-end justify-between mb-2">
      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">
        {label}
      </p>
      <p className="text-sm text-white font-black italic">{value}%</p>
    </div>
    <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
      <div
        className="h-full bg-blue-600 transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  </div>
);

const TaskCard = ({ task, onToggle, onDelete }) => {
  const completed = task.completed || task.status === "completed";

  return (
    <div
      className={`group rounded-2xl border p-4 transition-all ${
        completed
          ? "bg-zinc-950/30 border-white/[0.03] opacity-50"
          : "bg-zinc-900/50 border-white/[0.04] hover:border-blue-500/25"
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => onToggle(task._id)}
          className="mt-1 shrink-0 transition-transform active:scale-90"
        >
          {completed ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : (
            <Circle size={18} className="text-zinc-600 hover:text-blue-400" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${getCategoryTone(
                task.category
              )}`}
            >
              {getCategoryLabel(task.category)}
            </span>

            <span
              className={`px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${getPriorityTone(
                task.priority
              )}`}
            >
              {task.priority || "medium"}
            </span>

            <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-500 border border-white/[0.05] text-[8px] font-black uppercase tracking-widest">
              {task.type || "practice"}
            </span>

            {task.source === "ai" && <Pill tone="blue">AI</Pill>}
          </div>

          <h3
            className={`text-sm font-black uppercase italic tracking-tight ${
              completed ? "line-through text-zinc-600" : "text-white"
            }`}
          >
            {task.title}
          </h3>

          {task.description && (
            <p className="text-xs text-zinc-500 leading-5 mt-2 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-zinc-600 font-bold">
            <span className="inline-flex items-center gap-1">
              <Clock size={11} />
              {task.estimated_time || `${task.effortMinutes || 30} min`}
            </span>

            <span className="inline-flex items-center gap-1">
              <CalendarClock size={11} />
              {formatDate(task.date)}
            </span>

            {task.subTopic && (
              <span className="inline-flex items-center gap-1">
                <Target size={11} />
                {task.subTopic}
              </span>
            )}
          </div>

          {(task.whyThisTask || task.successCriteria) && (
            <div className="mt-3 rounded-xl bg-black/20 border border-white/[0.04] p-3">
              {task.whyThisTask && (
                <p className="text-[11px] text-blue-300 leading-5">
                  <span className="text-zinc-400 font-bold">Why:</span>{" "}
                  {task.whyThisTask}
                </p>
              )}

              {task.successCriteria && (
                <p className="text-[11px] text-emerald-300 leading-5 mt-1">
                  <span className="text-zinc-400 font-bold">Success:</span>{" "}
                  {task.successCriteria}
                </p>
              )}
            </div>
          )}

          {Array.isArray(task.resources) && task.resources.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {task.resources.map((resource, index) => {
                if (!resource.link) return null;

                return (
                  <a
                    key={`${resource.link}-${index}`}
                    href={resource.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 text-zinc-400 border border-white/[0.05] hover:text-white hover:border-blue-500/30 transition-all text-[10px] font-bold"
                  >
                    <ExternalLink size={11} />
                    {resource.label || resource.platform || "Resource"}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDelete(task)}
          className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, icon: Icon, right }) => (
  <div className="flex items-center justify-between gap-4 mb-5">
    <h2 className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.35em] flex items-center gap-2">
      <span className="w-1 h-3 bg-blue-500 rounded-full" />
      {Icon && <Icon size={14} className="text-blue-400" />}
      {title}
    </h2>
    {right}
  </div>
);

const StudyPlan = () => {
  const [activeCategory, setActiveCategory] = useState("dsa");
  const [tasks, setTasks] = useState([]);
  const [commandCenter, setCommandCenter] = useState(null);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [taskToDelete, setTaskToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "dsa",
    type: "practice",
    priority: "medium",
    estimated_time: "45 min",
    date: todayString(),
    resourceLink: "",
    whyThisTask: "",
    successCriteria: "",
  });

  const [missionForm, setMissionForm] = useState({
    category: "mixed",
    targetRole: "SDE Intern",
    targetCompany: "",
    timelineDays: 7,
    intensity: "hard",
  });

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [commandData, tasksData, progressData] = await Promise.all([
        getStudyCommandCenter(),
        getTasks({ limit: 300 }),
        getTopicProgress(),
      ]);

      setCommandCenter(commandData);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setProgress(progressData || {});
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load study command center."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => task.category === activeCategory);
  }, [tasks, activeCategory]);

  const todayTasks = useMemo(() => {
    return tasks.filter((task) => task.date === todayString());
  }, [tasks]);

  const aiTasks = useMemo(() => {
    return filteredTasks.filter((task) => task.source === "ai");
  }, [filteredTasks]);

  const manualTasks = useMemo(() => {
    return filteredTasks.filter((task) => task.source !== "ai");
  }, [filteredTasks]);

  const missedCount = commandCenter?.taskStats?.missed || 0;
  const readiness = commandCenter?.readiness || {};
  const todayMission = commandCenter?.todayMission || {};
  const weeklyAnalytics = commandCenter?.weeklyAnalytics || {};
  const weaknesses = commandCenter?.weaknesses || [];
  const strongestTopics = commandCenter?.strongestTopics || [];

  const refreshAfterChange = async () => {
    const [commandData, tasksData, progressData] = await Promise.all([
      getStudyCommandCenter(),
      getTasks({ limit: 300 }),
      getTopicProgress(),
    ]);

    setCommandCenter(commandData);
    setTasks(Array.isArray(tasksData) ? tasksData : []);
    setProgress(progressData || {});
  };

  const handleToggle = async (taskId) => {
    try {
      const updated = await toggleTask(taskId);

      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? updated : task))
      );

      await refreshAfterChange();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task.");
    }
  };

  const openDelete = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete?._id) return;

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      await deleteTask(taskToDelete._id);
      setNotice("Task deleted successfully.");
      setShowDeleteModal(false);
      setTaskToDelete(null);
      await refreshAfterChange();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    if (!newTask.title.trim()) {
      setError("Task title is required.");
      return;
    }

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      const resources = newTask.resourceLink
        ? [
            {
              label: "Resource",
              link: newTask.resourceLink,
              platform: "external",
            },
          ]
        : [];

      await addTask({
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        type: newTask.type,
        priority: newTask.priority,
        estimated_time: newTask.estimated_time,
        date: newTask.date,
        resources,
        whyThisTask: newTask.whyThisTask,
        successCriteria: newTask.successCriteria,
      });

      setShowTaskModal(false);
      setNewTask({
        title: "",
        description: "",
        category: activeCategory,
        type: "practice",
        priority: "medium",
        estimated_time: "45 min",
        date: todayString(),
        resourceLink: "",
        whyThisTask: "",
        successCriteria: "",
      });
      setNotice("Manual task added.");
      await refreshAfterChange();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add task.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateQuickAI = async () => {
    setAiLoading(true);
    setError("");
    setNotice("");

    try {
      await generateAIRecommendations({
        category: activeCategory,
        targetRole: missionForm.targetRole,
        targetCompany: missionForm.targetCompany,
        timelineDays: 7,
        intensity: "medium",
      });

      setNotice("AI tasks generated for current category.");
      await refreshAfterChange();
    } catch (err) {
      setError(err.response?.data?.message || "AI generation failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateMission = async (e) => {
    e.preventDefault();

    setAiLoading(true);
    setError("");
    setNotice("");

    try {
      await generateMissionPlan(missionForm);

      setShowMissionModal(false);
      setActiveCategory(
        missionForm.category === "mixed" ? "dsa" : missionForm.category
      );
      setNotice("Mission plan generated successfully.");
      await refreshAfterChange();
    } catch (err) {
      setError(err.response?.data?.message || "Mission generation failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleReschedule = async () => {
    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      const data = await rescheduleMissedTasks({
        limit: 10,
        priority: "high",
      });

      setNotice(data.message || "Missed tasks moved to today.");
      await refreshAfterChange();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reschedule tasks.");
    } finally {
      setActionLoading(false);
    }
  };

  const openAddTask = () => {
    setNewTask((prev) => ({
      ...prev,
      category: activeCategory,
      date: todayString(),
    }));
    setShowTaskModal(true);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <Loader2 size={34} className="animate-spin text-blue-500" />
          <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em]">
            Loading Study Command Center
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.45em] flex items-center gap-2">
              <Brain size={12} />
              AI Learning Operating System
            </p>
            <h1 className="text-4xl xl:text-5xl font-black text-white uppercase italic tracking-tighter">
              Study Command Center
            </h1>
            <p className="text-sm text-zinc-500 mt-2 max-w-3xl">
              Convert coding stats, weak topics, missed tasks, and internship goals into a daily execution plan.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-zinc-900 text-zinc-300 border border-white/[0.06] text-[9px] font-black uppercase tracking-widest hover:bg-zinc-800"
            >
              <RefreshCw size={14} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowMissionModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-500"
            >
              <Rocket size={14} />
              Generate Mission
            </button>

            <button
              type="button"
              onClick={openAddTask}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
            >
              <Plus size={14} />
              Add Task
            </button>
          </div>
        </div>

        {notice && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={16} />
            {notice}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
          <MetricCard
            label="Today Tasks"
            value={todayMission.totalTasks || todayTasks.length}
            subtext={`${todayMission.pendingTasks || 0} pending today`}
            icon={CalendarClock}
            tone="blue"
          />
          <MetricCard
            label="Weekly Completion"
            value={`${weeklyAnalytics.completionRate || 0}%`}
            subtext={`${weeklyAnalytics.completedTasks || 0}/${
              weeklyAnalytics.totalTasks || 0
            } tasks completed`}
            icon={BarChart3}
            tone="green"
          />
          <MetricCard
            label="Overall Ready"
            value={`${readiness.overall || 0}%`}
            subtext="DSA + dev + core + resume blend"
            icon={Target}
            tone="purple"
          />
          <MetricCard
            label="Missed Tasks"
            value={missedCount}
            subtext="Can be auto-rescheduled"
            icon={AlertTriangle}
            tone={missedCount > 0 ? "red" : "green"}
          />
          <MetricCard
            label="Study Load"
            value={`${todayMission.estimatedMinutes || 0}m`}
            subtext="Estimated effort today"
            icon={Clock}
            tone="yellow"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <section className="xl:col-span-4 rounded-3xl border border-white/[0.04] bg-zinc-900/40 p-6 shadow-xl">
            <SectionHeader
              title="Readiness Matrix"
              icon={ShieldCheck}
              right={<Pill tone="blue">Live</Pill>}
            />

            <div className="space-y-5">
              <ProgressBar label="DSA Readiness" value={readiness.dsa || progress.dsa || 0} />
              <ProgressBar label="Development" value={readiness.development || progress.development || 0} />
              <ProgressBar label="Core CS" value={readiness.core || progress.core || 0} />
              <ProgressBar label="Resume" value={readiness.resume || progress.resume || 0} />
              <ProgressBar label="Interview Blend" value={readiness.interview || 0} />
            </div>

            {missedCount > 0 && (
              <button
                type="button"
                onClick={handleReschedule}
                disabled={actionLoading}
                className="mt-6 w-full px-5 py-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest disabled:opacity-40"
              >
                {actionLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Rescheduling
                  </span>
                ) : (
                  "Move Missed Tasks To Today"
                )}
              </button>
            )}
          </section>

          <section className="xl:col-span-4 rounded-3xl border border-white/[0.04] bg-zinc-900/40 p-6 shadow-xl">
            <SectionHeader title="Weakness Intelligence" icon={Brain} />

            <div className="space-y-3">
              {weaknesses.length > 0 ? (
                weaknesses.slice(0, 5).map((item) => (
                  <div
                    key={item.topic}
                    className="rounded-2xl bg-black/20 border border-white/[0.04] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-white font-black uppercase italic truncate">
                        {item.topic}
                      </p>
                      <Pill
                        tone={
                          item.severity === "high"
                            ? "red"
                            : item.severity === "medium"
                            ? "yellow"
                            : "green"
                        }
                      >
                        {item.severity}
                      </Pill>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 leading-5">
                      {item.reason}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-600">
                  Sync coding platforms to unlock weak-topic diagnosis.
                </p>
              )}
            </div>
          </section>

          <section className="xl:col-span-4 rounded-3xl border border-white/[0.04] bg-zinc-900/40 p-6 shadow-xl">
            <SectionHeader title="Today Mission" icon={Flame} />

            {todayTasks.length > 0 ? (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {todayTasks.slice(0, 5).map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onToggle={handleToggle}
                    onDelete={openDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-white/[0.06]">
                <Flame size={36} className="text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500 font-bold">
                  No tasks scheduled for today.
                </p>
                <button
                  type="button"
                  onClick={openAddTask}
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest"
                >
                  Add Today Task
                </button>
              </div>
            )}
          </section>
        </div>

        <section className="rounded-3xl border border-white/[0.04] bg-zinc-900/40 p-6 shadow-xl">
          <SectionHeader
            title="Execution Board"
            icon={Layers}
            right={
              <button
                type="button"
                onClick={handleGenerateQuickAI}
                disabled={aiLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white text-[9px] font-black uppercase tracking-widest disabled:opacity-40"
              >
                {aiLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Generating
                  </>
                ) : (
                  <>
                    <Zap size={13} />
                    Generate Category AI Tasks
                  </>
                )}
              </button>
            }
          />

          <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
            {categories.map((category) => {
              const Icon = category.icon;
              const active = activeCategory === category.key;

              return (
                <button
                  type="button"
                  key={category.key}
                  onClick={() => setActiveCategory(category.key)}
                  className={`shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                    active
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-zinc-950/40 text-zinc-500 border-white/[0.05] hover:text-white hover:border-blue-500/30"
                  }`}
                >
                  <Icon size={14} />
                  {category.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em]">
                  Manual / System Tasks
                </h3>
                <Pill>{manualTasks.length}</Pill>
              </div>

              <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                {manualTasks.length > 0 ? (
                  manualTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onToggle={handleToggle}
                      onDelete={openDelete}
                    />
                  ))
                ) : (
                  <EmptyPanel
                    icon={Plus}
                    title="No manual tasks"
                    text="Add a task or generate an AI mission."
                    actionLabel="Add Task"
                    onAction={openAddTask}
                  />
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em]">
                  AI Generated Tasks
                </h3>
                <Pill tone="blue">{aiTasks.length}</Pill>
              </div>

              <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                {aiTasks.length > 0 ? (
                  aiTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onToggle={handleToggle}
                      onDelete={openDelete}
                    />
                  ))
                ) : (
                  <EmptyPanel
                    icon={Sparkles}
                    title="No AI tasks yet"
                    text="Generate a category plan or full mission plan."
                    actionLabel="Generate Mission"
                    onAction={() => setShowMissionModal(true)}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/[0.04] bg-zinc-900/40 p-6 shadow-xl">
          <SectionHeader title="Strongest Topics" icon={Target} />

          <div className="flex flex-wrap gap-3">
            {strongestTopics.length > 0 ? (
              strongestTopics.map((topic) => (
                <span
                  key={topic.topic}
                  className="px-4 py-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest"
                >
                  {topic.topic} · {topic.count}
                </span>
              ))
            ) : (
              <p className="text-sm text-zinc-600">
                Strong-topic data appears after platform sync.
              </p>
            )}
          </div>
        </section>
      </div>

      {showTaskModal && (
        <TaskModal
          newTask={newTask}
          setNewTask={setNewTask}
          onClose={() => setShowTaskModal(false)}
          onSubmit={handleManualSubmit}
          loading={actionLoading}
        />
      )}

      {showMissionModal && (
        <MissionModal
          form={missionForm}
          setForm={setMissionForm}
          onClose={() => setShowMissionModal(false)}
          onSubmit={handleGenerateMission}
          loading={aiLoading}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          task={taskToDelete}
          loading={actionLoading}
          onClose={() => {
            if (actionLoading) return;
            setShowDeleteModal(false);
            setTaskToDelete(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </MainLayout>
  );
};

const EmptyPanel = ({ icon: Icon, title, text, actionLabel, onAction }) => (
  <div className="h-72 flex flex-col items-center justify-center text-center rounded-3xl border border-dashed border-white/[0.06] bg-black/10">
    <Icon size={42} className="text-zinc-700 mb-4" />
    <h3 className="text-white font-black uppercase italic">{title}</h3>
    <p className="text-sm text-zinc-600 mt-2 max-w-xs">{text}</p>
    {actionLabel && (
      <button
        type="button"
        onClick={onAction}
        className="mt-5 px-5 py-3 rounded-2xl bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

const TaskModal = ({ newTask, setNewTask, onClose, onSubmit, loading }) => (
  <div className="fixed inset-0 z-[999] flex items-center justify-center px-3 py-4">
    <div
      className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      onClick={loading ? undefined : onClose}
    />

    <div className="relative w-full max-w-xl max-h-[90vh] overflow-hidden rounded-[1.5rem] border border-white/[0.06] bg-zinc-950 shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/[0.05] bg-zinc-950/95 px-5 py-4">
        <div>
          <p className="text-[8px] text-blue-500 font-black uppercase tracking-[0.35em]">
            Manual Directive
          </p>
          <h2 className="text-xl text-white font-black uppercase italic">
            Add Study Task
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5"
        >
          <X size={18} />
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="max-h-[calc(90vh-82px)] overflow-y-auto px-5 py-4 space-y-3"
      >
        <Input
          label="Task Title"
          value={newTask.title}
          onChange={(value) => setNewTask({ ...newTask, title: value })}
          placeholder="Solve 5 graph BFS problems"
          required
        />

        <Textarea
          label="Description"
          value={newTask.description}
          onChange={(value) => setNewTask({ ...newTask, description: value })}
          placeholder="What exactly should be done?"
          rows={2}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Category"
            value={newTask.category}
            onChange={(value) => setNewTask({ ...newTask, category: value })}
            options={categories.map((cat) => ({
              value: cat.key,
              label: cat.label,
            }))}
          />

          <Select
            label="Type"
            value={newTask.type}
            onChange={(value) => setNewTask({ ...newTask, type: value })}
            options={taskTypes.map((type) => ({
              value: type,
              label: type,
            }))}
          />

          <Select
            label="Priority"
            value={newTask.priority}
            onChange={(value) => setNewTask({ ...newTask, priority: value })}
            options={[
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Estimated Time"
            value={newTask.estimated_time}
            onChange={(value) => setNewTask({ ...newTask, estimated_time: value })}
            placeholder="45 min"
          />

          <Input
            label="Date"
            type="date"
            value={newTask.date}
            onChange={(value) => setNewTask({ ...newTask, date: value })}
          />
        </div>

        <Input
          label="Resource Link"
          value={newTask.resourceLink}
          onChange={(value) => setNewTask({ ...newTask, resourceLink: value })}
          placeholder="https://leetcode.com/..."
        />

        <Textarea
          label="Why This Task?"
          value={newTask.whyThisTask}
          onChange={(value) => setNewTask({ ...newTask, whyThisTask: value })}
          rows={2}
        />

        <Textarea
          label="Success Criteria"
          value={newTask.successCriteria}
          onChange={(value) => setNewTask({ ...newTask, successCriteria: value })}
          rows={2}
        />

        <div className="sticky bottom-0 -mx-5 bg-zinc-950/95 px-5 pt-3 pb-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-5 py-3 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-40"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Saving
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 justify-center">
                <Send size={14} />
                Deploy Task
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const MissionModal = ({ form, setForm, onClose, onSubmit, loading }) => (
  <div className="fixed inset-0 z-[999] flex items-center justify-center px-3 py-4">
    <div
      className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      onClick={loading ? undefined : onClose}
    />

    <div className="relative w-full max-w-xl max-h-[90vh] overflow-hidden rounded-[1.5rem] border border-blue-500/20 bg-zinc-950 shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/[0.05] bg-zinc-950/95 px-5 py-4">
        <div>
          <p className="text-[8px] text-blue-500 font-black uppercase tracking-[0.35em]">
            AI Mission Planner
          </p>
          <h2 className="text-xl text-white font-black uppercase italic">
            Generate Study Mission
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5"
        >
          <X size={18} />
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="max-h-[calc(90vh-82px)] overflow-y-auto px-5 py-4 space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Category"
            value={form.category}
            onChange={(value) => setForm({ ...form, category: value })}
            options={categories.map((cat) => ({
              value: cat.key,
              label: cat.label,
            }))}
          />

          <Select
            label="Intensity"
            value={form.intensity}
            onChange={(value) => setForm({ ...form, intensity: value })}
            options={[
              { value: "light", label: "Light" },
              { value: "medium", label: "Medium" },
              { value: "hard", label: "Hard" },
              { value: "extreme", label: "Extreme" },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Target Role"
            value={form.targetRole}
            onChange={(value) => setForm({ ...form, targetRole: value })}
            placeholder="SDE Intern"
          />

          <Input
            label="Target Company"
            value={form.targetCompany}
            onChange={(value) => setForm({ ...form, targetCompany: value })}
            placeholder="Google / Microsoft / Xelron AI"
          />
        </div>

        <Input
          label="Timeline Days"
          type="number"
          min="3"
          max="30"
          value={form.timelineDays}
          onChange={(value) => setForm({ ...form, timelineDays: Number(value) })}
        />

        <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 text-xs text-blue-200 leading-5">
          AI will use your platform stats, weak topics, current task history, and selected goal to generate daily tasks.
        </div>

        <div className="sticky bottom-0 -mx-5 bg-zinc-950/95 px-5 pt-3 pb-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-5 py-3 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-40"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Generating Mission
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 justify-center">
                <Rocket size={14} />
                Generate Mission Plan
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const DeleteModal = ({ task, loading, onClose, onConfirm }) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />

      <div className="relative w-full max-w-md rounded-[2rem] border border-red-500/20 bg-zinc-950 shadow-2xl p-7">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[9px] text-red-400 font-black uppercase tracking-[0.35em]">
              Confirm Delete
            </p>
            <h2 className="text-xl text-white font-black uppercase italic">
              Delete Task?
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-2xl bg-black/30 border border-white/[0.05] p-4 mb-5">
          <p className="text-sm text-zinc-300 font-bold">{task.title}</p>
          <p className="text-xs text-zinc-600 mt-1">
            {getCategoryLabel(task.category)} · {task.priority}
          </p>
        </div>

        <p className="text-sm text-zinc-400 leading-6">
          This task will be permanently removed from your study board.
        </p>

        <div className="flex gap-3 mt-7">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-5 py-3 rounded-2xl bg-zinc-900 text-zinc-300 border border-white/[0.06] text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-5 py-3 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-500 disabled:opacity-40"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Deleting
              </span>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Input = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  min,
  max,
}) => (
  <div>
    <label className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1.5 block">
      {label}
    </label>
    <input
      type={type}
      value={value}
      required={required}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl bg-zinc-950/60 border border-white/[0.05] px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500/40"
    />
  </div>
);

const Textarea = ({ label, value, onChange, placeholder, rows = 2 }) => (
  <div>
    <label className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1.5 block">
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-xl bg-zinc-950/60 border border-white/[0.05] px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500/40 resize-none"
    />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div>
    <label className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1.5 block">
      {label}
    </label>

    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full rounded-xl bg-zinc-950/60 border border-white/[0.05] px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500/40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"
      />
    </div>
  </div>
);

export default StudyPlan;