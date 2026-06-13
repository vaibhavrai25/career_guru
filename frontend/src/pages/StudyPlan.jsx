import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../api/axios";
import {
  addTask,
  deleteTask,
  getStudyCommandCenter,
  getTasks,
  rescheduleMissedTasks,
  toggleTask,
} from "../api/stats";
import {
  AlertTriangle,
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
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Activity,
  Lightbulb,
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
  "practice", "theory", "leetcode", "codeforces", "revision",
  "project-build", "core-cs", "system-design", "contest-upsolve"
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

const getCategoryLabel = (key) => categories.find((item) => item.key === key)?.label || key;
const getPriorityTone = (priority) => priorityStyles[priority] || priorityStyles.medium;
const getCategoryTone = (category) => categoryStyles[category] || categoryStyles.mixed;

const MetricCard = ({ label, value, subtext, icon: Icon, tone = "blue" }) => {
  const colors = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  };

  return (
    <div className="rounded-xl border border-white/[0.04] bg-zinc-900/40 p-4 shadow-sm flex flex-col justify-center">
      <div className="flex items-center justify-between gap-4 mb-2">
        <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">{label}</p>
        <div className={`p-2 rounded-lg border ${colors[tone] || colors.blue}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl text-white font-bold tracking-tight">{value}</p>
      {subtext && <p className="text-xs text-zinc-500 mt-1 font-medium">{subtext}</p>}
    </div>
  );
};

const TaskCard = ({ task, onToggle, onDelete }) => {
  const completed = task.completed || task.status === "completed";
  const isAI = task.source === "ai";

  return (
    <div
      className={`group rounded-xl border p-4 transition-all mb-3 ${
        completed
          ? "bg-zinc-900/20 border-white/[0.02] opacity-60"
          : isAI
          ? "bg-blue-900/10 border-blue-500/20 hover:border-blue-500/40 shadow-sm"
          : "bg-zinc-900/50 border-white/[0.04] hover:border-zinc-500/30 shadow-sm"
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
            <Circle size={18} className="text-zinc-500 hover:text-white" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${getCategoryTone(task.category)}`}>
              {getCategoryLabel(task.category)}
            </span>
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${getPriorityTone(task.priority)}`}>
              {task.priority || "medium"}
            </span>
            {isAI && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-blue-500/30 text-blue-400 bg-blue-500/10 text-[10px] font-semibold uppercase tracking-wider">
                <Sparkles size={10} /> AI Gen
              </span>
            )}
          </div>

          <h3 className={`text-sm font-bold tracking-tight ${completed ? "line-through text-zinc-500" : "text-white"}`}>
            {task.title}
          </h3>

          {task.description && (
            <p className="text-xs text-zinc-400 leading-relaxed mt-1.5 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock size={12} />
              {task.estimated_time || "30 min"}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarClock size={12} />
              {formatDate(task.date)}
            </span>
          </div>

          {Array.isArray(task.resources) && task.resources.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {task.resources.map((res, idx) =>
                res.link ? (
                  <a
                    key={idx}
                    href={res.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/50 text-zinc-300 border border-white/[0.05] hover:text-white hover:bg-zinc-700 transition-all text-xs font-medium"
                  >
                    <ExternalLink size={12} /> {res.label || "Resource"}
                  </a>
                ) : null
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDelete(task)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const StudyPlan = () => {
  const [tasks, setTasks] = useState([]);
  const [commandCenter, setCommandCenter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [aiSummary, setAiSummary] = useState("");

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [taskToDelete, setTaskToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  const [strengthenLoading, setStrengthenLoading] = useState(null);
  const [strengthenedTopic, setStrengthenedTopic] = useState(null);

  const initialTaskState = {
    title: "",
    description: "",
    category: "dsa",
    type: "practice",
    priority: "medium",
    estimated_time: "45 min",
    date: todayString(),
    resourceLink: "",
  };

  const [newTask, setNewTask] = useState(initialTaskState);
  const [topicDescription, setTopicDescription] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [commandData, tasksData] = await Promise.all([
        getStudyCommandCenter(),
        getTasks({ limit: 300 }),
      ]);
      setCommandCenter(commandData);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load study data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayTasks = useMemo(() => tasks.filter((t) => t.date === todayString()), [tasks]);
  const upcomingTasks = useMemo(() => tasks.filter((t) => t.date > todayString()), [tasks]);
  const backlogTasks = useMemo(
    () => tasks.filter((t) => t.date < todayString() && !t.completed && t.status !== "completed"),
    [tasks]
  );

  const missedCount = backlogTasks.length;
  const todayMission = commandCenter?.todayMission || {};
  const weaknesses = commandCenter?.weaknesses || [];

  const refreshAfterChange = async () => {
    const [commandData, tasksData] = await Promise.all([
      getStudyCommandCenter(),
      getTasks({ limit: 300 }),
    ]);
    setCommandCenter(commandData);
    setTasks(Array.isArray(tasksData) ? tasksData : []);
  };

  const handleToggle = async (taskId) => {
    try {
      const updated = await toggleTask(taskId);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
      await refreshAfterChange();
    } catch (err) {
      setError("Failed to update task.");
    }
  };

  // ✅ ADDED THIS MISSING FUNCTION BACK IN
  const openDelete = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete?._id) return;
    setActionLoading(true);
    try {
      await deleteTask(taskToDelete._id);
      setNotice("Task deleted.");
      setShowDeleteModal(false);
      setTaskToDelete(null);
      await refreshAfterChange();
    } catch (err) {
      setError("Failed to delete task.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return setError("Title required.");
    setActionLoading(true);
    try {
      const resources = newTask.resourceLink ? [{ label: "Resource", link: newTask.resourceLink }] : [];
      await addTask({ ...newTask, resources });
      setNewTask(initialTaskState);
      setShowTaskModal(false);
      setNotice("Task added successfully.");
      await refreshAfterChange();
    } catch (err) {
      setError("Failed to add task.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateTopicPlan = async (e) => {
    e.preventDefault();
    if (!topicDescription.trim()) return;
    setAiLoading(true);
    try {
      const { data } = await api.post("/ai/generate-topic", { topicDescription });
      setAiSummary(data.summary);
      if (data.tasks) {
        for (const aiTask of data.tasks) {
          await addTask({ ...aiTask, date: todayString(), source: "ai" });
        }
      }
      setShowTopicModal(false);
      setTopicDescription("");
      setNotice("AI Learning Path added to Today's Tasks.");
      await refreshAfterChange();
    } catch (err) {
      setError("Topic generation failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleStrengthen = async (topicName) => {
    setStrengthenLoading(topicName);
    try {
      const { data } = await api.post("/ai/strengthen", { topic: topicName });
      setStrengthenedTopic({ name: topicName, ...data });
    } catch (err) {
      setError("Failed to generate resource for topic.");
    } finally {
      setStrengthenLoading(null);
    }
  };

  const handleReschedule = async () => {
    setActionLoading(true);
    try {
      await rescheduleMissedTasks({ limit: 10, priority: "high" });
      setNotice("Backlog tasks moved to today.");
      await refreshAfterChange();
    } catch (err) {
      setError("Failed to reschedule tasks.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <MainLayout>
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <p className="text-sm font-medium text-zinc-500">Loading Study Plan...</p>
        </div>
      </MainLayout>
    );

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6 animate-fadeIn">
        
        {/* Compact Header & Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="text-blue-500" size={24} /> Study Board
            </h1>
            <p className="text-sm text-zinc-400 mt-1 font-medium">Manage tasks and AI-curated learning paths.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Refresh">
              <RefreshCw size={16} />
            </button>
            <button onClick={() => setShowTopicModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all">
              <Sparkles size={14} /> AI Topic Plan
            </button>
            <button onClick={() => { setNewTask({ ...initialTaskState, date: todayString() }); setShowTaskModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 text-black text-xs font-bold hover:bg-white transition-all">
              <Plus size={14} /> Add Task
            </button>
          </div>
        </div>

        {/* Alerts */}
        {notice && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 size={16} />{notice}</div>}
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 flex items-center gap-2"><AlertTriangle size={16} />{error}</div>}

        {/* Metrics & Weaknesses Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <MetricCard label="Tasks Today" value={todayMission.totalTasks || todayTasks.length} subtext={`${todayMission.pendingTasks || 0} pending`} icon={CalendarClock} tone="blue" />
          <MetricCard label="Effort Required" value={`${todayMission.estimatedMinutes || 0}m`} subtext="Estimated time" icon={Clock} tone="yellow" />
          
          <div className="lg:col-span-2 rounded-xl border border-white/[0.04] bg-zinc-900/40 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-2">
                <Brain size={14} className="text-purple-400" /> Topic Weaknesses
              </h2>
            </div>
            
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {weaknesses.length > 0 ? weaknesses.slice(0, 3).map((item) => (
                <div key={item.topic} className="min-w-[220px] rounded-lg bg-zinc-800/40 border border-white/[0.03] p-3 flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-white font-bold truncate mb-1">{item.topic}</p>
                    <p className="text-[10px] text-zinc-500 font-medium line-clamp-1 mb-2">{item.reason}</p>
                  </div>
                  <button onClick={() => handleStrengthen(item.topic)} disabled={strengthenLoading === item.topic} className="w-full py-1.5 rounded-md bg-zinc-800 border border-white/[0.05] text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                    {strengthenLoading === item.topic ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />} Strengthen
                  </button>
                </div>
              )) : (
                <p className="text-xs text-zinc-500">No weak topics detected. Sync coding platforms.</p>
              )}
            </div>

            {strengthenedTopic && (
              <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 relative">
                <button onClick={() => setStrengthenedTopic(null)} className="absolute top-2 right-2 text-zinc-500 hover:text-white"><X size={14}/></button>
                <p className="text-xs font-bold text-purple-400 mb-1">Guide: {strengthenedTopic.name}</p>
                <p className="text-xs text-zinc-300 mb-2 leading-relaxed">{strengthenedTopic.explanation}</p>
                {strengthenedTopic.resourceLink && (
                  <a href={strengthenedTopic.resourceLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 text-zinc-300 border border-white/[0.05] hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider">
                    <ExternalLink size={10} /> {strengthenedTopic.resourceLabel || "Read Article"}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Horizontal Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-280px)] min-h-[500px]">
          
          {/* Column 1: Today */}
          <div className="flex flex-col rounded-2xl bg-zinc-900/20 border border-white/[0.02] overflow-hidden">
            <div className="p-4 border-b border-white/[0.04] flex justify-between items-center bg-zinc-900/40">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> Today
              </h3>
              <span className="text-xs font-semibold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{todayTasks.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {aiSummary && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 mb-3">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Sparkles size={14} />
                    <h4 className="font-bold text-xs uppercase tracking-wider">Mission Summary</h4>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-medium">{aiSummary}</p>
                </div>
              )}
              {todayTasks.map((t) => (
                <TaskCard key={t._id} task={t} onToggle={handleToggle} onDelete={openDelete} />
              ))}
              {todayTasks.length === 0 && (
                <div className="text-center py-10 text-xs font-medium text-zinc-600 border-2 border-dashed border-white/[0.05] rounded-xl">No tasks scheduled for today.</div>
              )}
            </div>
          </div>

          {/* Column 2: Upcoming */}
          <div className="flex flex-col rounded-2xl bg-zinc-900/20 border border-white/[0.02] overflow-hidden">
            <div className="p-4 border-b border-white/[0.04] flex justify-between items-center bg-zinc-900/40">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Upcoming
              </h3>
              <span className="text-xs font-semibold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{upcomingTasks.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {upcomingTasks.map((t) => (
                <TaskCard key={t._id} task={t} onToggle={handleToggle} onDelete={openDelete} />
              ))}
              {upcomingTasks.length === 0 && (
                <div className="text-center py-10 text-xs font-medium text-zinc-600 border-2 border-dashed border-white/[0.05] rounded-xl">No upcoming tasks scheduled.</div>
              )}
            </div>
          </div>

          {/* Column 3: Backlog */}
          <div className="flex flex-col rounded-2xl bg-zinc-900/20 border border-white/[0.02] overflow-hidden">
            <div className="p-4 border-b border-white/[0.04] flex justify-between items-center bg-zinc-900/40">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" /> Backlog
              </h3>
              <span className="text-xs font-semibold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{backlogTasks.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {missedCount > 0 && (
                <button onClick={handleReschedule} disabled={actionLoading} className="w-full mb-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-xs font-semibold">
                  Reschedule Backlog to Today
                </button>
              )}
              {backlogTasks.map((t) => (
                <TaskCard key={t._id} task={t} onToggle={handleToggle} onDelete={openDelete} />
              ))}
              {backlogTasks.length === 0 && (
                <div className="text-center py-10 text-xs font-medium text-zinc-600 border-2 border-dashed border-white/[0.05] rounded-xl">Backlog is clear.</div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      {showTaskModal && (
        <TaskModal newTask={newTask} setNewTask={setNewTask} onClose={() => setShowTaskModal(false)} onSubmit={handleManualSubmit} loading={actionLoading} />
      )}
      {showTopicModal && (
        <TopicLearningModal topicDescription={topicDescription} setTopicDescription={setTopicDescription} onClose={() => setShowTopicModal(false)} onSubmit={handleGenerateTopicPlan} loading={aiLoading} />
      )}
      {showDeleteModal && (
        <DeleteModal task={taskToDelete} loading={actionLoading} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete} />
      )}
    </MainLayout>
  );
};

/* Modal Form Components */
const Input = ({ label, value, onChange, type = "text", placeholder, required }) => (
  <div>
    <label className="text-xs text-zinc-400 font-semibold mb-1.5 block">{label}</label>
    <input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl bg-zinc-900 border border-white/[0.05] px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500/50" />
  </div>
);

const Textarea = ({ label, value, onChange, placeholder, rows = 2 }) => (
  <div>
    <label className="text-xs text-zinc-400 font-semibold mb-1.5 block">{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full rounded-xl bg-zinc-900 border border-white/[0.05] px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500/50 resize-none" />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div>
    <label className="text-xs text-zinc-400 font-semibold mb-1.5 block">{label}</label>
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none w-full rounded-xl bg-zinc-900 border border-white/[0.05] px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500/50">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
    </div>
  </div>
);

const TaskModal = ({ newTask, setNewTask, onClose, onSubmit, loading }) => (
  <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
    <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-white/[0.05] flex flex-col shadow-2xl">
      <div className="flex justify-between items-center p-5 border-b border-white/[0.05]">
        <h2 className="text-base font-bold text-white">Add Task</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
      </div>
      <form onSubmit={onSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
        <Input label="Title" value={newTask.title} onChange={(v) => setNewTask({ ...newTask, title: v })} required placeholder="Task title..." />
        <Textarea label="Description" value={newTask.description} onChange={(v) => setNewTask({ ...newTask, description: v })} placeholder="Optional details..." />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Category" value={newTask.category} onChange={(v) => setNewTask({ ...newTask, category: v })} options={categories.map(c => ({value: c.key, label: c.label}))} />
          <Select label="Type" value={newTask.type} onChange={(v) => setNewTask({ ...newTask, type: v })} options={taskTypes.map(t => ({value: t, label: t}))} />
          <Input label="Date" type="date" value={newTask.date} onChange={(v) => setNewTask({ ...newTask, date: v })} />
          <Input label="Time Est." value={newTask.estimated_time} onChange={(v) => setNewTask({ ...newTask, estimated_time: v })} placeholder="30 min" />
        </div>
        <Input label="Resource URL" value={newTask.resourceLink} onChange={(v) => setNewTask({ ...newTask, resourceLink: v })} placeholder="https://..." />
      </form>
      <div className="p-5 border-t border-white/[0.05]">
        <button type="submit" onClick={onSubmit} disabled={loading} className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 flex justify-center items-center">
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Save Task"}
        </button>
      </div>
    </div>
  </div>
);

const TopicLearningModal = ({ topicDescription, setTopicDescription, onClose, onSubmit, loading }) => (
  <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
    <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-blue-500/20 p-6 shadow-2xl">
      <div className="flex justify-between mb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2"><Lightbulb size={18} className="text-blue-500"/> AI Topic Generator</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
      </div>
      <p className="text-xs text-zinc-400 mb-4 font-medium leading-relaxed">
        Describe what you want to learn. The AI will generate a step-by-step roadmap and automatically add actionable tasks directly to your "Today" board.
      </p>
      <form onSubmit={onSubmit}>
        <Textarea value={topicDescription} onChange={setTopicDescription} placeholder="E.g., I want to learn Dijkstra's Algorithm from scratch..." rows={4} />
        <button type="submit" disabled={loading || !topicDescription.trim()} className="w-full mt-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Generating Roadmap...</> : <><Sparkles size={16} /> Generate Learning Path</>}
        </button>
      </form>
    </div>
  </div>
);

const DeleteModal = ({ task, loading, onClose, onConfirm }) => {
  if (!task) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div className="relative w-full max-w-xs rounded-2xl bg-zinc-950 border border-white/[0.05] p-6 text-center shadow-2xl">
        <h2 className="text-base font-bold text-white mb-2">Delete Task?</h2>
        <p className="text-xs text-zinc-400 mb-6 truncate px-2 font-medium">{task.title}</p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 py-2 rounded-lg bg-zinc-800 text-sm font-semibold text-white hover:bg-zinc-700">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-500 flex justify-center">{loading ? <Loader2 size={16} className="animate-spin" /> : "Delete"}</button>
        </div>
      </div>
    </div>
  );
};

export default StudyPlan;