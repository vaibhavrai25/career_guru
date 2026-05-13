import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { getDashboard, getTodayTasks, syncAllPlatforms } from "../api/stats";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import {
  AlertTriangle,
  Zap,
  Target,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Activity,
  RefreshCw,
  Loader2,
} from "lucide-react";

const StatCard = ({ title, value, color, icon: Icon, subtitle }) => (
  <div className="relative group bg-zinc-900/40 backdrop-blur-3xl p-4 rounded-2xl border border-white/[0.05] hover:border-blue-500/30 transition-all duration-500 shadow-xl">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">
          {title}
        </p>
        <p className="text-2xl font-black text-white italic tracking-tighter leading-none">
          {value ?? 0}
        </p>
      </div>
      <div
        className={`p-2 rounded-lg bg-zinc-800/80 ${color.text} border border-white/5 shadow-inner`}
      >
        <Icon size={14} />
      </div>
    </div>
    {subtitle && (
      <p className="text-[9px] text-zinc-600 font-bold uppercase mt-3 tracking-widest italic">
        {subtitle}
      </p>
    )}
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setError("");

    try {
      const [dashboardData, tasksData] = await Promise.all([
        getDashboard(),
        getTodayTasks().catch(() => []),
      ]);

      setData(dashboardData);
      setTodayTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      console.error("Dashboard linkage error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const refreshHandler = () => {
      loadDashboard();
    };

    window.addEventListener("career-guru-sync-complete", refreshHandler);

    return () => {
      window.removeEventListener("career-guru-sync-complete", refreshHandler);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setError("");

    try {
      await syncAllPlatforms();
      await loadDashboard();
    } catch (err) {
      console.error("Dashboard sync failed:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Sync failed. Try again.");
    } finally {
      setSyncing(false);
    }
  };

  const difficultyData = useMemo(() => {
    if (!data?.platforms) return [];

    let easy = 0;
    let medium = 0;
    let hard = 0;

    ["leetcode", "codeforces", "codechef"].forEach((platform) => {
      const p = data.platforms?.[platform] || {};
      easy += Number(p.easy || 0);
      medium += Number(p.medium || 0);
      hard += Number(p.hard || 0);
    });

    return [
      { name: "Easy", value: easy, color: "#10b981" },
      { name: "Medium", value: medium, color: "#f59e0b" },
      { name: "Hard", value: hard, color: "#ef4444" },
    ];
  }, [data]);

  const radarData = useMemo(() => {
    if (!data?.analysis?.fullCompetency) return [];

    const groups = {
      Logic: ["recursion", "dp", "backtracking", "greedy", "bit"],
      Structures: ["array", "string", "tree", "graph", "stack", "hash"],
      Algorithms: ["sorting", "searching", "binary search", "two pointers"],
      Math: ["math", "geometry", "number theory"],
    };

    return Object.entries(groups).map(([group, tags]) => {
      const score = tags.reduce((sum, tag) => {
        const match = data.analysis.fullCompetency.find((item) =>
          String(item.topic || "").toLowerCase().includes(tag)
        );

        return sum + (match ? Number(match.score || 0) : 0);
      }, 0);

      return {
        subject: group,
        A: Math.min(Math.round(score * 1.5), 100),
      };
    });
  }, [data]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
            Loading command center
          </p>
        </div>
      </div>
    );
  }

  const weakestTopic = data?.analysis?.weakestTopics?.[0] || {
    topic: "No weak topic detected",
    score: 0,
    daysIdle: 0,
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fadeIn">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="text-center lg:text-left space-y-1">
            <div className="flex items-center justify-center lg:justify-start gap-2 text-blue-500 font-bold text-[9px] uppercase tracking-[0.4em]">
              <Activity size={12} /> Live Performance Matrix
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-none">
              Command <span className="text-blue-600">Center</span>
            </h1>
          </div>

          <div className="flex bg-zinc-900/60 p-1 rounded-2xl border border-white/5 shadow-2xl items-center">
            <div className="px-8 py-4 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 border border-white/10 text-center">
              <p className="text-[8px] text-blue-100 font-black uppercase tracking-[0.2em] mb-1">
                Readiness Index
              </p>
              <div className="text-4xl font-black text-white italic leading-none">
                {data?.irs || data?.combined?.readinessScore || 0}%
              </div>
            </div>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-8 text-center opacity-70 hover:opacity-100 transition-opacity disabled:opacity-40"
            >
              <RefreshCw
                className={`text-yellow-400 mb-1 mx-auto ${
                  syncing ? "animate-spin" : ""
                }`}
                size={20}
              />
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">
                {syncing ? "Syncing" : "Sync Now"}
              </p>
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Solved"
            value={data?.totalSolved || 0}
            icon={Target}
            color={{ text: "text-emerald-400" }}
            subtitle="Platform Aggregated"
          />
          <StatCard
            title="Streak"
            value={data?.streak || 0}
            icon={TrendingUp}
            color={{ text: "text-blue-400" }}
            subtitle="Consistency Chain"
          />
          <StatCard
            title="Dominant"
            value={data?.analysis?.strongestTopic || "N/A"}
            icon={Zap}
            color={{ text: "text-purple-400" }}
            subtitle="Peak Performance"
          />
          <StatCard
            title="Alerts"
            value={data?.analysis?.weakestTopics?.length || 0}
            icon={AlertTriangle}
            color={{ text: "text-red-400" }}
            subtitle="Skill Atrophy"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-zinc-900/30 rounded-[2rem] border border-white/5 p-8 flex flex-col shadow-inner">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-zinc-700 rounded-full" />
              Skill Architecture
            </h2>

            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                      fill: "#71717a",
                      fontSize: 9,
                      fontWeight: "900",
                      letterSpacing: "0.1em",
                    }}
                  />
                  <Radar
                    name="Proficiency"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      border: "1px solid #27272a",
                      borderRadius: "12px",
                      fontSize: "10px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900/30 rounded-[2rem] border border-white/5 flex flex-col shadow-inner overflow-hidden">
            <div className="p-6 border-b border-white/[0.03] bg-zinc-800/20">
              <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">
                Daily Directives
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 min-h-[300px]">
              {todayTasks.length > 0 ? (
                todayTasks.map((task, index) => (
                  <div
                    key={task._id || index}
                    className="flex items-center justify-between p-3 px-4 hover:bg-zinc-800/40 rounded-xl transition-all group border-b border-white/[0.02]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-1 h-8 bg-blue-500 rounded-full opacity-20 group-hover:opacity-100 transition-all" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-zinc-100 truncate uppercase tracking-tight italic">
                          {task.title}
                        </p>
                        <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mt-0.5">
                          {task.category || task.topicId?.name || "Directive"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={12}
                      className="text-zinc-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"
                    />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-10 py-20 grayscale">
                  <CheckCircle2 size={40} />
                  <p className="text-[10px] font-black uppercase mt-4">
                    All Mission Objectives Clear
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-600/5 mt-auto">
              <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black rounded-xl uppercase tracking-[0.2em] transition-all border border-white/5">
                Optimize Strategy
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900/30 p-8 rounded-[2.5rem] border border-white/5 relative flex flex-col items-center shadow-inner">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">
              Mastery Distribution
            </h2>

            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyData}
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={10}
                    dataKey="value"
                  >
                    {difficultyData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute top-[45%] left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <p className="text-2xl font-black text-white italic leading-none">
                  {data?.totalSolved || 0}
                </p>
                <p className="text-[7px] text-zinc-600 font-black uppercase tracking-[0.2em]">
                  Total AC
                </p>
              </div>
            </div>

            <div className="flex gap-6 mt-4">
              {difficultyData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/30 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8">
              Neural Pathway Decay
            </h2>

            <div className="space-y-8">
              {(data?.analysis?.weakestTopics || []).slice(0, 3).map((topic, index) => (
                <div key={`${topic.topic}-${index}`} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <p className="text-zinc-200 text-[11px] font-bold uppercase italic tracking-tight">
                      {topic.topic}
                    </p>

                    <div className="flex items-center gap-3">
                      <span className="text-[8px] font-black text-zinc-600 uppercase">
                        Idle {topic.daysIdle}d
                      </span>
                      <span className="text-[8px] font-black text-red-500 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">
                        WPS: {topic.score}
                      </span>
                    </div>
                  </div>

                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/[0.02]">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_8px_rgba(239,68,68,0.3)] transition-all duration-1000"
                      style={{
                        width: `${Math.max(
                          10,
                          Math.min(Number(topic.score || 0) * 5, 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              {(!data?.analysis?.weakestTopics ||
                data.analysis.weakestTopics.length === 0) && (
                <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">
                  No weak topic data found. Sync coding platforms first.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/20 via-black to-black p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-600/10 transition-all duration-700" />

          <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-center">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-[8px] font-black px-4 py-1.5 rounded-full border border-blue-500/10 uppercase tracking-[0.3em]">
                <Sparkles size={10} className="animate-pulse" />
                Strategic Advisory Engine
              </div>

              <h2 className="text-4xl font-black text-white italic leading-tight uppercase tracking-tighter">
                Critical Pathway:{" "}
                <span className="text-blue-500">{weakestTopic.topic}</span>
              </h2>

              <p className="text-zinc-500 text-sm leading-relaxed max-w-2xl font-medium">
                Analysis confirms a{" "}
                <span className="text-white font-bold">{weakestTopic.score} WPS</span>{" "}
                deficit in your core logic pathways. Prolonged inactivity{" "}
                <span className="text-red-500 font-bold">
                  ({weakestTopic.daysIdle} days)
                </span>{" "}
                is reducing your readiness signal. Initialize the recovery protocol
                from Study Plan.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full lg:w-64">
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/30 border border-white/10 active:scale-95">
                Initialize Protocol
              </button>

              <button className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] border border-white/5">
                Consult Guru AI
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;