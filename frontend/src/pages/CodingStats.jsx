import { useEffect, useMemo, useState, useContext } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Line
} from "recharts";
import MainLayout from "../layouts/MainLayout";
import { AuthContext } from "../context/AuthContext";
import {
  getAnalyticsSnapshots, getContestHistory, getDashboard, getDeepGitHubRepos, getSubmissions, getUpcomingContests, syncAllPlatforms,
} from "../api/stats";
import {
  Github, ExternalLink, TrendingUp, Calendar, Zap, ShieldCheck, Target, Cpu, BarChart3, Star, GitFork, RefreshCw, Loader2, AlertTriangle, Info, Trophy,
} from "lucide-react";

const CompactStat = ({ title, value, subtitle, icon: Icon }) => (
  <div className="bg-zinc-900/40 border border-white/[0.04] p-5 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all shadow-sm">
    <div className="flex items-center gap-4 min-w-0">
      <div className="p-3 rounded-xl bg-zinc-800/50 text-blue-500 border border-white/[0.05]">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
          {title}
        </p>
        <p className="text-2xl font-bold text-white tracking-tight truncate">
          {value ?? 0}
        </p>
      </div>
    </div>
    {subtitle && (
      <p className="text-xs text-zinc-500 font-medium">
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
    <div className="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-6 shadow-sm hover:border-white/[0.08] transition-colors">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-1">
            {platform.label}
          </p>
          <h3 className="text-4xl font-bold text-white tracking-tight">
            {platform.totalSolved || 0}
          </h3>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Total Problems Solved
          </p>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
            platform.status === "Linked"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : platform.status === "Error"
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-zinc-800 text-zinc-400 border border-white/5"
          }`}
        >
          {platform.status || "Pending"}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-emerald-400 font-semibold">
              Easy {platform.easy || 0}
            </span>
            <span className="text-xs text-zinc-500">{easyPct}%</span>
          </div>
          <div className="h-2 bg-zinc-800/80 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${easyPct}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-yellow-400 font-semibold">
              Medium {platform.medium || 0}
            </span>
            <span className="text-xs text-zinc-500">{mediumPct}%</span>
          </div>
          <div className="h-2 bg-zinc-800/80 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${mediumPct}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-red-400 font-semibold">
              Hard {platform.hard || 0}
            </span>
            <span className="text-xs text-zinc-500">{hardPct}%</span>
          </div>
          <div className="h-2 bg-zinc-800/80 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${hardPct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-4 gap-x-3 pt-5 border-t border-white/[0.04]">
        <div>
          <p className="text-xs text-zinc-500 font-medium mb-1">Current Rating</p>
          <p className="text-sm text-white font-semibold">{platform.currentRating || "--"}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 font-medium mb-1">Max Rating</p>
          <p className="text-sm text-white font-semibold">{platform.maxRating || "--"}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 font-medium mb-1">Contests Played</p>
          <p className="text-sm text-white font-semibold">{platform.contests || 0}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 font-medium mb-1">Upcoming Contests</p>
          <p className="text-sm text-white font-semibold">{platform.upcomingContests || 0}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 font-medium mb-1">Current Streak</p>
          <p className="text-sm text-white font-semibold">{platform.currentStreak || 0} days</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 font-medium mb-1">Max Streak</p>
          <p className="text-sm text-white font-semibold">{platform.maxStreak || 0} days</p>
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
    <div className="group p-5 bg-zinc-900/40 border border-white/[0.04] rounded-2xl hover:bg-zinc-800/40 hover:border-white/[0.08] transition-all duration-300 flex flex-col h-full shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-white/5">
            <Github className="text-zinc-400 group-hover:text-white transition-colors" size={18} />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors truncate">
              {repo.name}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {repo.language || "Multi Stack"}
            </p>
          </div>
        </div>

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-zinc-500 hover:text-blue-500 transition-colors bg-zinc-800/50 rounded-lg"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      <p className="text-sm text-zinc-400 line-clamp-2 min-h-[40px] leading-relaxed mb-5">
        {repo.description || "No description provided for this repository."}
      </p>

      <div className="mb-4">
        <div className="flex justify-between text-xs font-semibold text-zinc-400 mb-2">
          <span>Quality Score</span>
          <span className="text-blue-400">{qualityScore}/100</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${Math.min(qualityScore, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Star size={14} className="text-yellow-500" />
            <span className="text-xs font-medium">
              {repo.stars || repo.stargazers_count || 0}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400">
            <GitFork size={14} />
            <span className="text-xs font-medium">
              {repo.forks || repo.forks_count || 0}
            </span>
          </div>
        </div>

        <span className="text-xs text-zinc-500 font-medium">
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
      const [ dashboardData, repoData, submissionData, leetcodeSubmissionData, codeforcesSubmissionData, codechefSubmissionData,
        contestData, upcomingData, snapshotData,
      ] = await Promise.all([
        getDashboard(),
        getDeepGitHubRepos({ limit: 50, sort: "quality" }).catch(() => ({ data: [] })),
        getSubmissions({ limit: 1000 }).catch(() => ({ data: [] })),
        getSubmissions({ platform: "leetcode", limit: 1000 }).catch(() => ({ data: [] })),
        getSubmissions({ platform: "codeforces", limit: 1000 }).catch(() => ({ data: [] })),
        getSubmissions({ platform: "codechef", limit: 1000 }).catch(() => ({ data: [] })),
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
    const refreshHandler = () => loadData();
    window.addEventListener("career-guru-sync-complete", refreshHandler);
    return () => window.removeEventListener("career-guru-sync-complete", refreshHandler);
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

  const currentPlatformData = activeTab === "overall" ? null : allStats?.platforms?.[activeTab];

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
      <div className="h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-sm font-medium text-zinc-500">
            Loading analytics data...
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
        derivedStreak || 0;

  const maxStreakDisplay =
    activeTab === "overall"
      ? allStats.maxStreak || 0
      : activeTab === "github"
      ? allStats?.platforms?.github?.activeDays || 0
      : currentPlatformData?.submissionsSummary?.maxStreak ||
        currentPlatformData?.maxStreak || 0;

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
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fadeIn">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-500 font-semibold text-xs tracking-wider uppercase">
              <ShieldCheck size={14} /> Data Synchronized
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Coding Analytics
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex p-1 bg-zinc-900/50 rounded-xl border border-white/[0.04] overflow-x-auto no-scrollbar">
              {["overall", "leetcode", "codeforces", "codechef", "github"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${
                      activeTab === tab
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
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
              className="px-5 py-3 rounded-xl bg-zinc-800 text-zinc-300 border border-white/[0.05] text-sm font-medium hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {syncing ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Syncing
                </>
              ) : (
                <>
                  <RefreshCw size={16} /> Sync
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-3">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {limitedDataNote && (
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-300 flex items-center gap-3">
            <Info size={18} />
            {limitedDataNote}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <CompactStat
            title={activeTab === "github" ? "Repositories" : "Total Solved"}
            value={totalDisplay}
            icon={Target}
            subtitle={activeTab === "github" ? "Public Repos" : "Across Platforms"}
          />
          <CompactStat
            title="Current Streak"
            value={`${streakDisplay || 0} days`}
            icon={TrendingUp}
            subtitle="Active daily chain"
          />
          <CompactStat
            title="Max Streak"
            value={`${maxStreakDisplay || 0} days`}
            icon={Trophy}
            subtitle="Historical best chain"
          />
          <CompactStat
            title={activeTab === "github" ? "Prod Ready" : "Rating/Rank"}
            value={activeTab === "overall" ? rankDisplay : ratingDisplay}
            icon={Cpu}
            subtitle={activeTab === "overall" ? "Strongest Area" : "Current standing"}
          />
        </div>

        {activeTab === "overall" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(allStats.platformOverview || []).map((platform) => (
              <PlatformOverviewCard key={platform.platform} platform={platform} />
            ))}
          </div>
        )}

        {activeTab === "github" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {repos.map((repo) => (
              <RepoCard key={repo._id || repo.fullName || repo.name} repo={repo} />
            ))}

            {repos.length === 0 && (
              <div className="col-span-full py-20 text-center bg-zinc-900/30 rounded-3xl border border-dashed border-white/[0.05] text-zinc-500 text-sm font-medium">
                No repositories linked to the system. Ensure your GitHub handle is synced.
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-zinc-900/40 rounded-3xl border border-white/[0.04] p-7 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                  {activeTab === "overall"
                    ? "Performance Overview"
                    : "Rating Trajectory"}
                </h2>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {activeTab === "overall" ? (
                    <ComposedChart data={ratingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="platform" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} tickLine={false} axisLine={false} />
                      <ChartTooltip
                        contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px", color: "#fff" }}
                        itemStyle={{ fontSize: "13px" }}
                        labelStyle={{ color: "#a1a1aa", marginBottom: "4px" }}
                      />
                      <Bar yAxisId="left" dataKey="currentRating" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Current Rating" maxBarSize={50} />
                      <Bar yAxisId="left" dataKey="maxRating" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Max Rating" maxBarSize={50} />
                      <Line yAxisId="right" type="monotone" dataKey="contests" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981", stroke: "#18181b", strokeWidth: 2 }} name="Contests Played" />
                    </ComposedChart>
                  ) : (
                    <AreaChart data={ratingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                      <ChartTooltip
                        contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px", color: "#fff" }}
                        labelStyle={{ color: "#a1a1aa", marginBottom: "4px" }}
                      />
                      <Area type="monotone" dataKey="rating" stroke="#3b82f6" strokeWidth={3} fill="url(#colorRating)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 bg-zinc-900/40 rounded-3xl border border-white/[0.04] p-7 shadow-sm flex flex-col">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6">
                Key Metrics
              </h2>

              <div className="space-y-4 flex-1">
                {[
                  {
                    label: "Submissions",
                    val: activeTab === "overall" ? submissions.length : submissions.filter((s) => s.platform === activeTab).length,
                    desc: "Total code pushes recorded",
                    icon: ShieldCheck,
                  },
                  {
                    label: "Current Rating",
                    val: activeTab === "overall" ? "-" : currentPlatformData?.rating || 0,
                    desc: "Latest platform standing",
                    icon: BarChart3,
                  },
                  {
                    label: "Peak Rating",
                    val: activeTab === "overall" ? "-" : currentPlatformData?.maxRating || 0,
                    desc: "Highest recorded rating",
                    icon: Trophy,
                  },
                  {
                    label: "Upcoming Contests",
                    val: platformUpcomingContests.length,
                    desc: "Scheduled competitions",
                    icon: Zap,
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/30 border border-white/[0.03]">
                    <div className="flex items-center gap-4">
                      <item.icon size={18} className="text-zinc-500" />
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {item.label}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-blue-500">
                      {item.val}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-12 bg-zinc-900/40 rounded-3xl border border-white/[0.04] p-7 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <Calendar className="text-blue-500" size={18} />
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                    Activity Heatmap ({year})
                  </h2>
                </div>

                <div className="flex bg-zinc-800/50 p-1 rounded-lg border border-white/5 gap-1">
                  {[2024, 2025, 2026].map((item) => (
                    <button
                      key={item}
                      onClick={() => setYear(item)}
                      className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        year === item
                          ? "bg-blue-600 text-white"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-8">
                {months.map((month, index) => {
                  const monthPrefix = `${year}-${String(index + 1).padStart(2, "0")}`;
                  const hits = currentHeatDates.filter((date) => date.startsWith(monthPrefix)).length;

                  return (
                    <div key={month} className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-semibold text-zinc-400 uppercase">
                          {month}
                        </span>
                        <span className="text-xs font-medium text-zinc-600">
                          {hits} entries
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {[...Array(getDaysInMonth(index, year))].map((_, day) => {
                          const date = `${monthPrefix}-${String(day + 1).padStart(2, "0")}`;
                          const isActive = currentHeatDates.includes(date);

                          return (
                            <div
                              key={date}
                              className={`w-3 h-3 rounded-sm transition-all ${
                                isActive
                                  ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                                  : "bg-zinc-800/60"
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

            <div className="lg:col-span-7 bg-zinc-900/40 rounded-3xl border border-white/[0.04] p-7 shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-8">
                Skill Distribution
              </h2>

              {topicChartData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicChartData} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                      <XAxis type="number" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="topic" type="category" stroke="#e4e4e7" fontSize={12} tickLine={false} axisLine={false} width={80} />
                      <ChartTooltip
                        contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px", color: "#fff" }}
                        cursor={{ fill: '#27272a', opacity: 0.4 }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-center">
                  <p className="text-sm text-zinc-500 font-medium">
                    Topic data unavailable. Solve more problems or refresh the sync.
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-zinc-900/40 rounded-3xl border border-white/[0.04] p-7 shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6">
                Upcoming Contests
              </h2>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {platformUpcomingContests.slice(0, 8).map((contest) => (
                  <a
                    key={contest._id || `${contest.platform}-${contest.contestId}`}
                    href={contest.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-4 rounded-xl bg-zinc-800/30 border border-white/[0.03] hover:border-blue-500/40 hover:bg-zinc-800/60 transition-all"
                  >
                    <div className="flex flex-col gap-1.5">
                      <p className="text-sm font-semibold text-zinc-200 truncate">
                        {contest.title}
                      </p>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-zinc-500 capitalize">
                          {contest.platform} {contest.isFallback ? "(Estimated)" : ""}
                        </p>
                        <p className="text-xs font-medium text-blue-400">
                          {contest.startTime
                            ? new Date(contest.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                            : "TBA"}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}

                {platformUpcomingContests.length === 0 && (
                  <p className="text-sm text-zinc-500 font-medium text-center py-10">
                    No upcoming contests cached. Sync platforms to update schedule.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CodingStats;