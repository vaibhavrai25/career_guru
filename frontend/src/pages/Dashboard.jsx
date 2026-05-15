import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Flame,
  Github,
  GraduationCap,
  Layers,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

const difficultyColors = {
  Easy: "#10b981",
  Medium: "#f59e0b",
  Hard: "#ef4444",
};

const platformMeta = {
  leetcode: {
    label: "LeetCode",
    tone: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    icon: Code2,
  },
  codeforces: {
    label: "Codeforces",
    tone: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: Trophy,
  },
  codechef: {
    label: "CodeChef",
    tone: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    icon: Flame,
  },
  github: {
    label: "GitHub",
    tone: "text-zinc-300",
    bg: "bg-zinc-500/10",
    border: "border-white/[0.08]",
    icon: Github,
  },
};

const getNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatCompact = (value) => {
  const num = getNumber(value);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
};

const getPlatformData = (data, platform) => {
  return data?.platforms?.[platform] || data?.[platform] || {};
};

const getTotalSolved = (data) => {
  if (data?.totalSolved !== undefined) return getNumber(data.totalSolved);

  const lc = getPlatformData(data, "leetcode");
  const cf = getPlatformData(data, "codeforces");
  const cc = getPlatformData(data, "codechef");

  return (
    getNumber(lc.totalSolved) +
    getNumber(cf.totalSolved) +
    getNumber(cc.totalSolved)
  );
};

const getReadiness = (data) => {
  return getNumber(
    data?.irs ??
      data?.combined?.readinessScore ??
      data?.readinessScore ??
      data?.analysis?.readinessScore,
    0
  );
};

const getCurrentStreak = (data) => {
  if (data?.streak !== undefined) return getNumber(data.streak);

  const platforms = ["leetcode", "codeforces", "codechef"];

  return Math.max(
    0,
    ...platforms.map((platform) =>
      getNumber(
        getPlatformData(data, platform)?.streak ??
          getPlatformData(data, platform)?.currentStreak ??
          getPlatformData(data, platform)?.submissionsSummary?.currentStreak
      )
    )
  );
};

const getBestRating = (data) => {
  const platforms = ["leetcode", "codeforces", "codechef"];

  return Math.max(
    0,
    ...platforms.map((platform) =>
      getNumber(
        getPlatformData(data, platform)?.rating ??
          getPlatformData(data, platform)?.currentRating
      )
    )
  );
};

const Section = ({ title, subtitle, icon: Icon, right, children, className = "" }) => (
  <section
    className={`rounded-3xl border border-white/[0.05] bg-zinc-900/40 shadow-xl shadow-black/20 ${className}`}
  >
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/[0.04]">
      <div className="min-w-0">
        <h2 className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.28em] flex items-center gap-2">
          {Icon && <Icon size={14} className="text-blue-400" />}
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] text-zinc-600 mt-1 truncate">{subtitle}</p>
        )}
      </div>
      {right}
    </div>

    <div className="p-5">{children}</div>
  </section>
);

const MetricCard = ({ title, value, subtitle, icon: Icon, tone = "blue", to }) => {
  const tones = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    green: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    zinc: "text-zinc-300 bg-zinc-500/10 border-white/[0.08]",
  };

  const Card = (
    <div className="h-full rounded-3xl border border-white/[0.05] bg-zinc-900/40 p-5 shadow-xl shadow-black/20 hover:border-blue-500/25 transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.22em] truncate">
            {title}
          </p>
          <p className="text-3xl text-white font-black italic tracking-tighter mt-2 leading-none truncate">
            {value}
          </p>
        </div>

        <div
          className={`p-3 rounded-2xl border ${
            tones[tone] || tones.blue
          }`}
        >
          <Icon size={18} />
        </div>
      </div>

      {subtitle && (
        <p className="text-[10px] text-zinc-600 mt-4 font-bold uppercase tracking-widest line-clamp-1">
          {subtitle}
        </p>
      )}
    </div>
  );

  if (!to) return Card;

  return (
    <Link to={to} className="block h-full">
      {Card}
    </Link>
  );
};

const PlatformCard = ({ platform, data }) => {
  const meta = platformMeta[platform] || platformMeta.leetcode;
  const Icon = meta.icon;

  const totalSolved = getNumber(data?.totalSolved);
  const rating = getNumber(data?.rating ?? data?.currentRating);
  const maxRating = getNumber(data?.maxRating ?? data?.peakRating);
  const status = data?.status || (data?.handle ? "Linked" : "Not Linked");

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-black/20 p-4 hover:border-blue-500/20 transition-all">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-xl ${meta.bg} ${meta.tone} border ${meta.border}`}>
            <Icon size={15} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white font-black truncate">{meta.label}</p>
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest truncate">
              {data?.handle || status}
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${
            status === "Linked"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : status === "Error"
              ? "bg-red-500/10 text-red-400 border-red-500/20"
              : "bg-zinc-800 text-zinc-500 border-white/[0.05]"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniValue label="Solved" value={formatCompact(totalSolved)} />
        <MiniValue label="Rating" value={rating || "--"} />
        <MiniValue label="Max" value={maxRating || "--"} />
      </div>
    </div>
  );
};

const MiniValue = ({ label, value }) => (
  <div className="rounded-xl bg-zinc-950/70 border border-white/[0.04] px-3 py-2">
    <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
      {label}
    </p>
    <p className="text-sm text-white font-black mt-1 truncate">{value}</p>
  </div>
);

const TaskItem = ({ task }) => (
  <Link
    to="/study"
    className="flex items-center justify-between gap-4 rounded-2xl bg-black/20 border border-white/[0.04] px-4 py-3 hover:border-blue-500/20 hover:bg-blue-500/[0.04] transition-all group"
  >
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={`w-2 h-2 rounded-full ${
          task.completed ? "bg-emerald-500" : "bg-blue-500"
        }`}
      />
      <div className="min-w-0">
        <p
          className={`text-sm font-bold truncate ${
            task.completed ? "text-zinc-600 line-through" : "text-zinc-200"
          }`}
        >
          {task.title}
        </p>
        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mt-1">
          {task.category || task.type || "Study Task"}
        </p>
      </div>
    </div>

    <ChevronRight
      size={14}
      className="text-zinc-700 group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0"
    />
  </Link>
);

const InsightRow = ({ title, value, subtitle, tone = "blue" }) => {
  const tones = {
    blue: "text-blue-400",
    red: "text-red-400",
    green: "text-emerald-400",
    yellow: "text-yellow-400",
  };

  return (
    <div className="rounded-2xl bg-black/20 border border-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-white font-black truncate">{title}</p>
          {subtitle && (
            <p className="text-xs text-zinc-600 mt-1 line-clamp-2">{subtitle}</p>
          )}
        </div>
        <p className={`text-lg font-black italic shrink-0 ${tones[tone] || tones.blue}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

const QuickAction = ({ to, title, subtitle, icon: Icon }) => (
  <Link
    to={to}
    className="rounded-2xl border border-white/[0.05] bg-zinc-950/40 p-4 hover:border-blue-500/25 hover:bg-blue-500/[0.04] transition-all group"
  >
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-white font-black truncate">{title}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>

      <ArrowUpRight
        size={16}
        className="text-zinc-700 group-hover:text-blue-400 transition-all shrink-0"
      />
    </div>
  </Link>
);

const EmptyState = ({ icon: Icon, title, text }) => (
  <div className="h-full min-h-[180px] rounded-2xl border border-dashed border-white/[0.06] flex flex-col items-center justify-center text-center px-5 py-8">
    <Icon size={34} className="text-zinc-700 mb-3" />
    <p className="text-sm text-zinc-400 font-black">{title}</p>
    <p className="text-xs text-zinc-600 mt-1 max-w-sm">{text}</p>
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

      setData(dashboardData || {});
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

  const totalSolved = useMemo(() => getTotalSolved(data), [data]);
  const readiness = useMemo(() => getReadiness(data), [data]);
  const currentStreak = useMemo(() => getCurrentStreak(data), [data]);
  const bestRating = useMemo(() => getBestRating(data), [data]);

  const difficultyData = useMemo(() => {
    const lc = getPlatformData(data, "leetcode");
    const cf = getPlatformData(data, "codeforces");
    const cc = getPlatformData(data, "codechef");

    const easy = getNumber(lc.easy) + getNumber(cf.easy) + getNumber(cc.easy);
    const medium =
      getNumber(lc.medium) + getNumber(cf.medium) + getNumber(cc.medium);
    const hard = getNumber(lc.hard) + getNumber(cf.hard) + getNumber(cc.hard);

    return [
      { name: "Easy", value: easy, color: difficultyColors.Easy },
      { name: "Medium", value: medium, color: difficultyColors.Medium },
      { name: "Hard", value: hard, color: difficultyColors.Hard },
    ].filter((item) => item.value > 0);
  }, [data]);

  const platformBarData = useMemo(() => {
    return ["leetcode", "codeforces", "codechef"].map((platform) => {
      const p = getPlatformData(data, platform);

      return {
        platform: platformMeta[platform]?.label || platform,
        solved: getNumber(p.totalSolved),
      };
    });
  }, [data]);

  const radarData = useMemo(() => {
    const fullCompetency = data?.analysis?.fullCompetency || [];

    const groups = {
      Logic: ["recursion", "dp", "backtracking", "greedy", "bit"],
      Structures: ["array", "string", "tree", "graph", "stack", "hash"],
      Algorithms: ["sorting", "searching", "binary search", "two pointers"],
      Math: ["math", "geometry", "number theory"],
      CP: ["implementation", "constructive", "brute force", "dfs", "bfs"],
    };

    if (!Array.isArray(fullCompetency) || fullCompetency.length === 0) {
      return [
        { subject: "Logic", score: Math.min(100, Math.round(totalSolved / 5)) },
        { subject: "DS", score: Math.min(100, Math.round(totalSolved / 6)) },
        { subject: "Algo", score: Math.min(100, Math.round(totalSolved / 7)) },
        { subject: "Math", score: Math.min(100, Math.round(totalSolved / 10)) },
        { subject: "CP", score: Math.min(100, Math.round(bestRating / 20)) },
      ];
    }

    return Object.entries(groups).map(([group, tags]) => {
      const score = tags.reduce((sum, tag) => {
        const match = fullCompetency.find((item) =>
          String(item.topic || "").toLowerCase().includes(tag)
        );

        return sum + (match ? getNumber(match.score) : 0);
      }, 0);

      return {
        subject: group,
        score: Math.min(Math.round(score * 1.4), 100),
      };
    });
  }, [data, totalSolved, bestRating]);

  const weakestTopics = useMemo(() => {
    return Array.isArray(data?.analysis?.weakestTopics)
      ? data.analysis.weakestTopics.slice(0, 4)
      : [];
  }, [data]);

  const strongestTopic = data?.analysis?.strongestTopic || "Not enough data";
  const weakestTopic = weakestTopics?.[0] || {
    topic: "No weak topic detected",
    score: 0,
    daysIdle: 0,
  };

  const platformCards = useMemo(() => {
    return ["leetcode", "codeforces", "codechef", "github"].map((platform) => ({
      platform,
      data: getPlatformData(data, platform),
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-500" size={34} />
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-600">
            Loading dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.45em] flex items-center gap-2">
              <Activity size={12} />
              Live Career Operating System
            </p>
            <h1 className="text-4xl xl:text-5xl font-black tracking-tighter text-white uppercase italic leading-none mt-2">
              Command <span className="text-blue-600">Center</span>
            </h1>
            <p className="text-sm text-zinc-500 mt-3 max-w-2xl">
              Compact overview of coding progress, study execution, weak areas, and next actions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-blue-600 text-white border border-white/10 shadow-xl shadow-blue-950/40">
              <p className="text-[8px] text-blue-100 font-black uppercase tracking-[0.25em]">
                Readiness
              </p>
              <p className="text-3xl font-black italic leading-none mt-1">
                {readiness}%
              </p>
            </div>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-5 py-4 rounded-2xl bg-zinc-900 text-zinc-300 border border-white/[0.06] text-[9px] font-black uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-40"
            >
              <RefreshCw
                size={14}
                className={syncing ? "animate-spin text-yellow-400" : "text-yellow-400"}
              />
              {syncing ? "Syncing" : "Sync All"}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Total Solved"
            value={formatCompact(totalSolved)}
            subtitle="Across coding platforms"
            icon={Target}
            tone="green"
            to="/coding"
          />
          <MetricCard
            title="Current Streak"
            value={currentStreak}
            subtitle="Best active platform streak"
            icon={Flame}
            tone="yellow"
            to="/coding"
          />
          <MetricCard
            title="Best Rating"
            value={bestRating || "--"}
            subtitle="Current strongest rating signal"
            icon={Trophy}
            tone="purple"
            to="/coding"
          />
          <MetricCard
            title="Today Tasks"
            value={todayTasks.length}
            subtitle="Study directives scheduled"
            icon={BookOpen}
            tone="blue"
            to="/study"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section
              title="Skill Architecture"
              subtitle="Compact competency radar"
              icon={BarChart3}
              className="min-h-[360px]"
            >
              <div className="h-[270px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{
                        fill: "#a1a1aa",
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#09090b",
                        border: "1px solid #27272a",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Section>

            <Section
              title="Solved Distribution"
              subtitle="Difficulty and platform split"
              icon={Layers}
              className="min-h-[360px]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                <div className="h-[250px] relative">
                  {difficultyData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={difficultyData}
                            innerRadius={58}
                            outerRadius={78}
                            paddingAngle={6}
                            dataKey="value"
                          >
                            {difficultyData.map((entry) => (
                              <Cell
                                key={entry.name}
                                fill={entry.color}
                                stroke="none"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#09090b",
                              border: "1px solid #27272a",
                              borderRadius: "12px",
                              fontSize: "12px",
                              color: "#fff",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-2xl text-white font-black italic leading-none">
                          {formatCompact(totalSolved)}
                        </p>
                        <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mt-1">
                          Solved
                        </p>
                      </div>
                    </>
                  ) : (
                    <EmptyState
                      icon={Target}
                      title="No difficulty data"
                      text="Sync platforms to populate distribution."
                    />
                  )}
                </div>

                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformBarData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#18181b"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="platform"
                        stroke="#71717a"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#71717a"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          border: "1px solid #27272a",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#fff",
                        }}
                      />
                      <Bar dataKey="solved" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-3">
                {difficultyData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <Section
            title="Today Mission"
            subtitle="Next study directives"
            icon={GraduationCap}
            className="xl:col-span-4 min-h-[360px]"
            right={
              <Link
                to="/study"
                className="text-[9px] text-blue-400 font-black uppercase tracking-widest hover:text-blue-300"
              >
                Open
              </Link>
            }
          >
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {todayTasks.length > 0 ? (
                todayTasks.slice(0, 5).map((task, index) => (
                  <TaskItem key={task._id || index} task={task} />
                ))
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title="No tasks today"
                  text="Generate a study mission or add a manual task."
                />
              )}
            </div>
          </Section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <Section
            title="Platform Snapshot"
            subtitle="Linked profiles and current signals"
            icon={Activity}
            className="xl:col-span-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platformCards.map((item) => (
                <PlatformCard
                  key={item.platform}
                  platform={item.platform}
                  data={item.data}
                />
              ))}
            </div>
          </Section>

          <Section
            title="Weakness Intelligence"
            subtitle="Most urgent areas"
            icon={AlertTriangle}
            className="xl:col-span-4"
            right={
              <Link
                to="/study"
                className="text-[9px] text-blue-400 font-black uppercase tracking-widest hover:text-blue-300"
              >
                Fix
              </Link>
            }
          >
            <div className="space-y-3">
              {weakestTopics.length > 0 ? (
                weakestTopics.map((topic, index) => (
                  <InsightRow
                    key={`${topic.topic}-${index}`}
                    title={topic.topic || "Unknown topic"}
                    value={`${getNumber(topic.score)} WPS`}
                    subtitle={`Idle ${getNumber(topic.daysIdle)} days · needs revision`}
                    tone={index === 0 ? "red" : "yellow"}
                  />
                ))
              ) : (
                <EmptyState
                  icon={AlertTriangle}
                  title="No weak topic data"
                  text="Sync platforms and build history to unlock topic decay analysis."
                />
              )}
            </div>
          </Section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <Section
            title="Strategic Advisory"
            subtitle="One clear next move"
            icon={Sparkles}
            className="xl:col-span-7"
          >
            <div className="rounded-3xl bg-gradient-to-br from-blue-600/10 via-black/20 to-black/10 border border-blue-500/10 p-6">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-[8px] font-black px-3 py-1.5 rounded-full border border-blue-500/10 uppercase tracking-[0.25em] mb-5">
                <Sparkles size={10} />
                AI Recovery Signal
              </div>

              <h2 className="text-2xl xl:text-3xl text-white font-black italic tracking-tight leading-tight">
                Focus now:{" "}
                <span className="text-blue-400">
                  {weakestTopic.topic || "Study consistency"}
                </span>
              </h2>

              <p className="text-sm text-zinc-500 leading-7 mt-3">
                Your strongest visible area is{" "}
                <span className="text-white font-bold">{strongestTopic}</span>.
                The most urgent recovery area is{" "}
                <span className="text-red-400 font-bold">
                  {weakestTopic.topic || "not available"}
                </span>
                {weakestTopic.daysIdle
                  ? `, idle for ${weakestTopic.daysIdle} days.`
                  : "."}{" "}
                Use Study Plan to generate a short connected mission instead of
                adding random tasks.
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  to="/study"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all"
                >
                  Initialize Protocol
                  <ArrowUpRight size={14} />
                </Link>

                <Link
                  to="/coding"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.05] text-white border border-white/[0.06] text-[9px] font-black uppercase tracking-widest hover:bg-white/[0.1] transition-all"
                >
                  View Coding Data
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </Section>

          <Section
            title="Quick Actions"
            subtitle="Jump to the right module"
            icon={Zap}
            className="xl:col-span-5"
          >
            <div className="grid grid-cols-1 gap-3">
              <QuickAction
                to="/coding"
                title="Coding Analytics"
                subtitle="Heatmaps, contests, topics"
                icon={Code2}
              />
              <QuickAction
                to="/study"
                title="Study Mission"
                subtitle="Generate connected tasks"
                icon={BookOpen}
              />
              <QuickAction
                to="/resume"
                title="Resume Vault"
                subtitle="ATS and readiness insights"
                icon={Target}
              />
              <QuickAction
                to="/profile"
                title="Profile Settings"
                subtitle="Handles and public portfolio"
                icon={Activity}
              />
            </div>
          </Section>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;