import { useEffect, useMemo, useState, useContext } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import MainLayout from "../layouts/MainLayout";
import { AuthContext } from "../context/AuthContext";
import {
  getAnalyticsSnapshots,
  getContestHistory,
  getDashboard,
  getDeepGitHubRepos,
  getSubmissions,
  getUpcomingContests,
  syncAllPlatforms,
} from "../api/stats";
import {
  Github,
  ExternalLink,
  TrendingUp,
  Calendar,
  Zap,
  Globe,
  ShieldCheck,
  Target,
  Cpu,
  BarChart3,
  Star,
  GitFork,
  Terminal,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Info,
  Trophy,
} from "lucide-react";

const CompactStat = ({ title, value, subtitle, icon: Icon }) => (
  <div className="bg-zinc-900/40 border border-white/[0.03] p-4 rounded-xl flex items-center justify-between group hover:border-blue-500/20 transition-all shadow-inner relative overflow-hidden">
    <div className="flex items-center gap-4 min-w-0">
      <div className="p-2 rounded-lg bg-zinc-800/50 text-blue-500 border border-white/[0.05]">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1.5">
          {title}
        </p>
        <p className="text-xl font-black text-white italic tracking-tighter leading-none truncate">
          {value ?? 0}
        </p>
      </div>
    </div>
    {subtitle && (
      <p className="text-[7px] text-zinc-700 font-black uppercase tracking-tighter">
        {subtitle}
      </p>
    )}
  </div>
);

const PlatformOverviewCard = ({ platform }) => {
  const totalDifficulty =
    Number(platform.easy || 0) + Number(platform.medium || 0) + Number(platform.hard || 0);

  const easyPct = totalDifficulty
    ? Math.round((Number(platform.easy || 0) / totalDifficulty) * 100)
    : 0;
  const mediumPct = totalDifficulty
    ? Math.round((Number(platform.medium || 0) / totalDifficulty) * 100)
    : 0;
  const hardPct = totalDifficulty
    ? Math.round((Number(platform.hard || 0) / totalDifficulty) * 100)
    : 0;

  return (
    <div className="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-5 shadow-xl">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-blue-500">
            {platform.label}
          </p>
          <h3 className="text-3xl font-black text-white italic tracking-tighter mt-1">
            {platform.totalSolved || 0}
          </h3>
          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
            Questions Solved
          </p>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
            platform.status === "Linked"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : platform.status === "Error"
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-zinc-800 text-zinc-500 border border-white/5"
          }`}
        >
          {platform.status || "Pending"}
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[8px] text-emerald-400 font-black uppercase">
              Easy {platform.easy || 0}
            </span>
            <span className="text-[8px] text-zinc-600">{easyPct}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${easyPct}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[8px] text-yellow-400 font-black uppercase">
              Medium {platform.medium || 0}
            </span>
            <span className="text-[8px] text-zinc-600">{mediumPct}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500" style={{ width: `${mediumPct}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[8px] text-red-400 font-black uppercase">
              Hard {platform.hard || 0}
            </span>
            <span className="text-[8px] text-zinc-600">{hardPct}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: `${hardPct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.03]">
        <div>
          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
            Current Rating
          </p>
          <p className="text-sm text-white font-black italic">
            {platform.currentRating || 0}
          </p>
        </div>

        <div>
          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
            Max Rating
          </p>
          <p className="text-sm text-white font-black italic">
            {platform.maxRating || 0}
          </p>
        </div>

        <div>
          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
            Contests
          </p>
          <p className="text-sm text-white font-black italic">
            {platform.contests || 0}
          </p>
        </div>

        <div>
          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
            Upcoming
          </p>
          <p className="text-sm text-white font-black italic">
            {platform.upcomingContests || 0}
          </p>
        </div>

        <div>
          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
            Current Streak
          </p>
          <p className="text-sm text-white font-black italic">
            {platform.currentStreak || 0}d
          </p>
        </div>

        <div>
          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
            Max Streak
          </p>
          <p className="text-sm text-white font-black italic">
            {platform.maxStreak || 0}d
          </p>
        </div>
      </div>
    </div>
  );
};

const RepoCard = ({ repo }) => {
  const url = repo.url || repo.html_url || "";
  const updatedAt = repo.pushedAtGithub || repo.updatedAtGithub || repo.updated_at;
  const qualityScore = repo.quality?.qualityScore || 0;

  return (
    <div className="group p-4 bg-zinc-900/40 border border-white/[0.04] rounded-2xl hover:bg-zinc-800/40 transition-all duration-300 flex flex-col h-full shadow-xl">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center border border-white/5">
            <Github className="text-zinc-500 group-hover:text-white" size={14} />
          </div>

          <div className="min-w-0">
            <h3 className="text-[11px] font-bold text-zinc-200 group-hover:text-blue-400 transition-colors tracking-tight uppercase italic truncate">
              {repo.name}
            </h3>
            <p className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">
              {repo.language || "Multi Stack"}
            </p>
          </div>
        </div>

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="p-1 text-zinc-700 hover:text-blue-500"
          >
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      <p className="text-[10px] text-zinc-500 line-clamp-2 min-h-[30px] font-medium leading-relaxed mb-4 italic">
        {repo.description ||
          "System overview: No mission brief defined for this deployment."}
      </p>

      <div className="mb-3">
        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">
          <span>Quality</span>
          <span>{qualityScore}/100</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full"
            style={{ width: `${Math.min(qualityScore, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-zinc-600">
            <Star size={10} className="text-yellow-600" />
            <span className="text-[9px] font-black">
              {repo.stars || repo.stargazers_count || 0}
            </span>
          </div>

          <div className="flex items-center gap-1 text-zinc-600">
            <GitFork size={10} />
            <span className="text-[9px] font-black">
              {repo.forks || repo.forks_count || 0}
            </span>
          </div>
        </div>

        <span className="text-[7px] text-zinc-700 font-black uppercase tracking-tighter">
          {updatedAt ? new Date(updatedAt).toLocaleDateString() : "No date"}
        </span>
      </div>
    </div>
  );
};

const buildRatingChartData = (history = []) =>
  history.map((item) => ({
    ...item,
    date: item.date ? new Date(item.date).toLocaleDateString() : "",
    rating: item.rating || item.newRating || 0,
  }));

const calculateStreakFromDates = (dates) => {
  if (!Array.isArray(dates) || dates.length === 0) return 0;

  const sortedDesc = [...new Set(dates)]
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a));

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (sortedDesc[0] !== today && sortedDesc[0] !== yesterday) return 0;

  let streak = 0;
  let expectedDate = new Date(sortedDesc[0]);

  for (const dateString of sortedDesc) {
    const currentDate = new Date(dateString);
    const diff = Math.round((expectedDate - currentDate) / 86400000);

    if (diff === 0 || diff === 1) {
      streak += 1;
      expectedDate = currentDate;
    } else {
      break;
    }
  }

  return streak;
};

const convertMapObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value === "object") return value;
  return {};
};

const CodingStats = () => {
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("overall");
  const [allStats, setAllStats] = useState(null);
  const [repos, setRepos] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [contestHistory, setContestHistory] = useState([]);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const loadData = async () => {
    if (!user) return;

    setError("");

    try {
      const [
        dashboardData,
        repoData,
        submissionData,
        leetcodeSubmissionData,
        codeforcesSubmissionData,
        codechefSubmissionData,
        contestData,
        upcomingData,
        snapshotData,
      ] = await Promise.all([
        getDashboard(),
        getDeepGitHubRepos({ limit: 50, sort: "quality" }).catch(() => ({
          data: [],
        })),
        getSubmissions({ limit: 1000 }).catch(() => ({ data: [] })),
        getSubmissions({ platform: "leetcode", limit: 1000 }).catch(() => ({
          data: [],
        })),
        getSubmissions({ platform: "codeforces", limit: 1000 }).catch(() => ({
          data: [],
        })),
        getSubmissions({ platform: "codechef", limit: 1000 }).catch(() => ({
          data: [],
        })),
        getContestHistory({ limit: 300 }).catch(() => ({ data: [] })),
        getUpcomingContests({ limit: 100 }).catch(() => ({ data: [] })),
        getAnalyticsSnapshots({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      const mergedSubmissionsMap = new Map();

      [
        ...(submissionData?.data || []),
        ...(leetcodeSubmissionData?.data || []),
        ...(codeforcesSubmissionData?.data || []),
        ...(codechefSubmissionData?.data || []),
      ].forEach((item) => {
        const key = item._id || `${item.platform}-${item.submissionId}-${item.date}`;
        mergedSubmissionsMap.set(key, item);
      });

      setAllStats(dashboardData);
      setRepos(repoData?.data || []);
      setSubmissions(Array.from(mergedSubmissionsMap.values()));
      setContestHistory(contestData?.data || []);
      setUpcomingContests(upcomingData?.data || []);
      setSnapshots(snapshotData?.data || []);
    } catch (err) {
      console.error("Telemetry linkage error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to load coding analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const refreshHandler = () => {
      loadData();
    };

    window.addEventListener("career-guru-sync-complete", refreshHandler);

    return () => {
      window.removeEventListener("career-guru-sync-complete", refreshHandler);
    };
  }, [user]);

  const handleSync = async () => {
    setSyncing(true);
    setError("");

    try {
      await syncAllPlatforms();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const currentPlatformData =
    activeTab === "overall" ? null : allStats?.platforms?.[activeTab];

  const currentHeatDates = useMemo(() => {
    if (activeTab === "github") {
      const repoDates = repos
        .map((repo) => repo.pushedAtGithub || repo.updatedAtGithub)
        .filter(Boolean)
        .map((date) => new Date(date).toISOString().split("T")[0]);

      const githubDates = allStats?.platforms?.github?.contributionDates || [];

      return [...new Set([...repoDates, ...githubDates])];
    }

    if (activeTab === "overall") {
      const submissionDates = submissions
        .filter((item) => item.isAccepted)
        .map((item) => item.date)
        .filter(Boolean);

      const profileDates = [
        ...(allStats?.platforms?.leetcode?.dates || []),
        ...(allStats?.platforms?.codeforces?.dates || []),
        ...(allStats?.platforms?.codechef?.dates || []),
      ];

      return [...new Set([...submissionDates, ...profileDates])];
    }

    const submissionDates = submissions
      .filter((item) => item.platform === activeTab && item.isAccepted)
      .map((item) => item.date)
      .filter(Boolean);

    const profileDates = currentPlatformData?.dates || [];

    return [...new Set([...submissionDates, ...profileDates])];
  }, [activeTab, repos, submissions, allStats, currentPlatformData]);

  const platformContestHistory = useMemo(() => {
    if (activeTab === "overall") return contestHistory;
    return contestHistory.filter((item) => item.platform === activeTab);
  }, [activeTab, contestHistory]);

  const ratingChartData = useMemo(() => {
    if (activeTab === "overall") {
      const overview = allStats?.platformOverview || [];

      return overview.map((item) => ({
        platform: item.label,
        currentRating: item.currentRating || 0,
        maxRating: item.maxRating || 0,
        contests: item.contests || 0,
      }));
    }

    return buildRatingChartData(currentPlatformData?.ratingHistory || []);
  }, [activeTab, snapshots, currentPlatformData, allStats]);

  const topicChartData = useMemo(() => {
    const topicWise =
      activeTab === "overall"
        ? allStats?.analysis?.fullCompetency?.reduce((acc, item) => {
            acc[item.topic] = item.count || item.score || 0;
            return acc;
          }, {})
        : convertMapObject(currentPlatformData?.topicWise);

    return Object.entries(topicWise || {})
      .map(([topic, count]) => ({
        topic,
        count: Number(count || 0),
      }))
      .filter((item) => item.topic && item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [activeTab, allStats, currentPlatformData]);

  const platformUpcomingContests = useMemo(() => {
    if (activeTab === "overall") return upcomingContests;
    return upcomingContests.filter((item) => item.platform === activeTab);
  }, [activeTab, upcomingContests]);

  const getDaysInMonth = (monthIdx, selectedYear) =>
    new Date(selectedYear, monthIdx + 1, 0).getDate();

  if (loading || !allStats) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#060606]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-0.5 bg-zinc-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600 animate-pulse" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">
            Loading telemetry
          </p>
        </div>
      </div>
    );
  }

  const derivedStreak = calculateStreakFromDates(currentHeatDates);

  const totalDisplay =
    activeTab === "github"
      ? repos.length
      : activeTab === "overall"
      ? allStats.totalSolved
      : currentPlatformData?.totalSolved;

  const streakDisplay =
    activeTab === "overall"
      ? allStats.streak || derivedStreak
      : activeTab === "github"
      ? allStats?.platforms?.github?.activeDays || derivedStreak
      : currentPlatformData?.submissionsSummary?.currentStreak ||
        currentPlatformData?.streak ||
        derivedStreak ||
        0;

  const maxStreakDisplay =
    activeTab === "overall"
      ? allStats.maxStreak || 0
      : activeTab === "github"
      ? allStats?.platforms?.github?.activeDays || 0
      : currentPlatformData?.submissionsSummary?.maxStreak ||
        currentPlatformData?.maxStreak ||
        0;

  const ratingDisplay =
    activeTab === "github"
      ? allStats?.platforms?.github?.projectSignals?.productionReadyRepos || 0
      : activeTab === "overall"
      ? allStats?.irs || 0
      : currentPlatformData?.rating || 0;

  const rankDisplay =
    activeTab === "github"
      ? "Active"
      : activeTab === "overall"
      ? allStats?.analysis?.strongestTopic || "N/A"
      : currentPlatformData?.rank || "Novice";

  const limitedDataNote =
    activeTab !== "overall" && activeTab !== "github"
      ? currentPlatformData?.submissionsSummary?.limitedData
        ? currentPlatformData?.submissionsSummary?.note ||
          "This platform has limited public submission data."
        : ""
      : "";

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5 animate-fadeIn">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-500 font-bold text-[8px] uppercase tracking-[0.5em]">
              <ShieldCheck size={10} /> Neural-Telemetry Synchronized
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">
              ANALYTICS <span className="text-blue-600">PRO</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-zinc-900/60 backdrop-blur-3xl rounded-xl border border-white/[0.05] overflow-x-auto no-scrollbar">
              {["overall", "leetcode", "codeforces", "codechef", "github"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      activeTab === tab
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-zinc-600 hover:text-zinc-300"
                    }`}
                  >
                    {tab}
                  </button>
                )
              )}
            </div>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-3 rounded-xl bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50"
            >
              {syncing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {limitedDataNote && (
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-300 flex items-center gap-2">
            <Info size={16} />
            {limitedDataNote}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CompactStat
            title={activeTab === "github" ? "Repositories" : "Solved"}
            value={totalDisplay}
            icon={Target}
            subtitle="Total Units"
          />
          <CompactStat
            title="Current Streak"
            value={`${streakDisplay || 0}d`}
            icon={TrendingUp}
            subtitle="Active Chain"
          />
          <CompactStat
            title="Max Streak"
            value={`${maxStreakDisplay || 0}d`}
            icon={Trophy}
            subtitle="Peak Chain"
          />
          <CompactStat
            title={activeTab === "github" ? "Prod Ready" : "Rating/Rank"}
            value={activeTab === "overall" ? rankDisplay : ratingDisplay}
            icon={Cpu}
            subtitle={activeTab === "overall" ? "Strongest Area" : "Current Grade"}
          />
        </div>

        {activeTab === "overall" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {(allStats.platformOverview || []).map((platform) => (
              <PlatformOverviewCard key={platform.platform} platform={platform} />
            ))}
          </div>
        )}

        {activeTab === "github" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {repos.map((repo) => (
              <RepoCard key={repo._id || repo.fullName || repo.name} repo={repo} />
            ))}

            {repos.length === 0 && (
              <div className="col-span-full py-20 text-center bg-zinc-900/20 rounded-3xl border border-dashed border-white/5 text-zinc-700 text-[10px] font-black uppercase tracking-[0.3em]">
                No repositories linked to system
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-zinc-900/30 rounded-3xl border border-white/[0.04] p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-1 h-3 bg-blue-600 rounded-full" />
                <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">
                  {activeTab === "overall"
                    ? "Platform Rating / Contest Matrix"
                    : "Trajectory Analysis"}
                </h2>
              </div>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {activeTab === "overall" ? (
                    <BarChart data={ratingChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#18181b"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="platform"
                        stroke="#52525b"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#3f3f46"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                        fontWeight="900"
                        width={35}
                      />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          border: "1px solid #18181b",
                          borderRadius: "8px",
                          fontSize: "10px",
                        }}
                      />
                      <Bar dataKey="currentRating" fill="#2563eb" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="maxRating" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="contests" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : (
                    <AreaChart data={ratingChartData}>
                      <defs>
                        <linearGradient
                          id="colorRating"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#18181b"
                        vertical={false}
                      />
                      <XAxis dataKey="date" hide />
                      <YAxis
                        stroke="#3f3f46"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                        fontWeight="900"
                        width={35}
                      />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          border: "1px solid #18181b",
                          borderRadius: "8px",
                          fontSize: "10px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="rating"
                        stroke="#2563eb"
                        strokeWidth={2}
                        fill="url(#colorRating)"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-zinc-900/30 rounded-3xl border border-white/[0.04] p-6 shadow-2xl">
              <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                <div className="w-1 h-3 bg-blue-500 rounded-full" />
                Neural Vitals
              </h2>

              <div className="space-y-3">
                {[
                  {
                    label: "Submissions",
                    val:
                      activeTab === "overall"
                        ? submissions.length
                        : submissions.filter((s) => s.platform === activeTab).length,
                    desc:
                      activeTab === "codechef"
                        ? "Limited public data"
                        : "Raw telemetry stored",
                    icon: ShieldCheck,
                  },
                  {
                    label: "Current Rating",
                    val:
                      activeTab === "overall"
                        ? "-"
                        : currentPlatformData?.rating || 0,
                    desc: "Platform current rating",
                    icon: BarChart3,
                  },
                  {
                    label: "Max Rating",
                    val:
                      activeTab === "overall"
                        ? "-"
                        : currentPlatformData?.maxRating || 0,
                    desc: "Peak recorded rating",
                    icon: Trophy,
                  },
                  {
                    label: "Upcoming",
                    val: platformUpcomingContests.length,
                    desc: "Contest windows",
                    icon: Zap,
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/[0.03]"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={14} className="text-zinc-600" />
                      <div>
                        <p className="text-[10px] font-bold text-zinc-200 uppercase leading-none">
                          {item.label}
                        </p>
                        <p className="text-[8px] text-zinc-700 mt-1 font-medium">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-blue-500 italic tracking-tighter">
                      {item.val}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-12 bg-zinc-900/30 rounded-3xl border border-white/[0.04] p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <Calendar className="text-blue-500" size={14} />
                  <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">
                    Activity Matrix ({year})
                  </h2>
                </div>

                <div className="flex bg-zinc-800/50 p-1 rounded-lg border border-white/5 gap-1">
                  {[2024, 2025, 2026].map((item) => (
                    <button
                      key={item}
                      onClick={() => setYear(item)}
                      className={`px-4 py-1.5 rounded-md text-[8px] font-black transition-all ${
                        year === item
                          ? "bg-blue-600 text-white"
                          : "text-zinc-600 hover:text-zinc-400"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-8">
                {months.map((month, index) => {
                  const monthPrefix = `${year}-${String(index + 1).padStart(
                    2,
                    "0"
                  )}`;

                  const hits = currentHeatDates.filter((date) =>
                    date.startsWith(monthPrefix)
                  ).length;

                  return (
                    <div key={month} className="space-y-2">
                      <div className="flex justify-between items-center px-0.5">
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                          {month}
                        </span>
                        <span className="text-[7px] font-black text-blue-500/60 uppercase">
                          {hits} Hits
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {[...Array(getDaysInMonth(index, year))].map((_, day) => {
                          const date = `${monthPrefix}-${String(day + 1).padStart(
                            2,
                            "0"
                          )}`;
                          const isActive = currentHeatDates.includes(date);

                          return (
                            <div
                              key={date}
                              className={`w-2.5 h-2.5 rounded-[1px] transition-all ${
                                isActive
                                  ? "bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                                  : "bg-zinc-800/40"
                              }`}
                              title={date}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-7 bg-zinc-900/30 rounded-3xl border border-white/[0.04] p-6 shadow-2xl">
              <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">
                Topic Distribution
              </h2>

              {topicChartData.length > 0 ? (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#18181b"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="topic"
                        stroke="#52525b"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#52525b"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          border: "1px solid #18181b",
                          borderRadius: "8px",
                          fontSize: "10px",
                        }}
                      />
                      <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-center">
                  <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.3em]">
                    Topic data unavailable for this platform. Sync again or verify handle.
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-zinc-900/30 rounded-3xl border border-white/[0.04] p-6 shadow-2xl">
              <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">
                Upcoming Contest Windows
              </h2>

              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {platformUpcomingContests.slice(0, 8).map((contest) => (
                  <a
                    key={contest._id || `${contest.platform}-${contest.contestId}`}
                    href={contest.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] hover:border-blue-500/30 transition-all"
                  >
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] text-zinc-200 font-black uppercase truncate">
                          {contest.title}
                        </p>
                        <p className="text-[8px] text-zinc-600 font-black uppercase mt-1">
                          {contest.platform}
                          {contest.isFallback ? " · estimated" : ""}
                        </p>
                      </div>
                      <p className="text-[8px] text-blue-500 font-black whitespace-nowrap">
                        {contest.startTime
                          ? new Date(contest.startTime).toLocaleDateString()
                          : "TBA"}
                      </p>
                    </div>
                  </a>
                ))}

                {platformUpcomingContests.length === 0 && (
                  <p className="text-[10px] text-zinc-700 font-black uppercase tracking-widest leading-relaxed">
                    {activeTab === "codechef"
                      ? "CodeChef upcoming contests depend on public contest API availability."
                      : "No upcoming contests cached. Sync platforms first."}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-900/10 to-transparent p-8 rounded-3xl border border-white/[0.04] relative overflow-hidden group shadow-2xl flex items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-500 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              <Terminal size={10} /> Neural Diagnostic Protocol
            </div>

            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
              DATA <span className="text-blue-600">INTEGRITY</span>
            </h2>

            <p className="text-zinc-500 text-[10px] leading-relaxed font-medium">
              Your{" "}
              <span className="text-zinc-200 uppercase font-bold">
                {activeTab}
              </span>{" "}
              telemetry reads from normalized backend collections. Heatmap uses
              raw submissions first, then falls back to platform calendar dates.
            </p>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="whitespace-nowrap px-8 py-4 bg-white text-black font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            {syncing ? "SYNCING..." : "INITIATE SYNC"}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default CodingStats;