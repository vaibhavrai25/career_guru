import { useContext, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { ThemeContext } from "../context/ThemeContext";
import { 
  Github, ExternalLink, Code, Activity, ShieldCheck, Loader2, 
  AlertTriangle, Trophy, Star, Moon, Sun, BarChart3, GitFork, 
  CalendarDays, Target, Layers, Medal, Share2, ClipboardCheck
} from "lucide-react";

const platformLabels = { leetcode: "LeetCode", codeforces: "Codeforces", codechef: "CodeChef", github: "GitHub" };
const platformIcons = { leetcode: Code, codeforces: Trophy, codechef: Activity, github: Github };
const platformTones = { leetcode: "text-blue-400", codeforces: "text-blue-500", codechef: "text-orange-400", github: "text-zinc-200" };

const getNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const formatCompact = (value) => { 
  const num = getNumber(value); 
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`; 
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`; 
  return String(num); 
};

const getPlatformProfileUrl = (platform, handle) => { 
  const c = String(handle || "").trim(); 
  if (!c) return ""; 
  const urls = { 
    leetcode: `https://leetcode.com/u/${c}/`, 
    codeforces: `https://codeforces.com/profile/${c}`, 
    codechef: `https://www.codechef.com/users/${c}`, 
    github: `https://github.com/${c}` 
  }; 
  return urls[platform] || ""; 
};

// --- RESTORED HELPER FUNCTIONS ---
const getRatingHistory = (platformData = {}) => {
  if (Array.isArray(platformData.ratingHistory)) return platformData.ratingHistory;
  if (Array.isArray(platformData.contestHistory)) return platformData.contestHistory;
  if (Array.isArray(platformData.contests)) return platformData.contests;
  return [];
};

const getContestCount = (platformData = {}) => {
  return getRatingHistory(platformData).length || getNumber(platformData.contestCount || 0);
};

const getMaxRatingFromHistory = (platformData = {}) => {
  const history = getRatingHistory(platformData);
  const fromHistory = Math.max(0, ...history.map((item) => getNumber(item.rating || item.newRating || item.currentRating || item.rankRating || 0)));
  return Math.max(fromHistory, getNumber(platformData.maxRating || platformData.peakRating || 0));
};

const getLatestRatingFromHistory = (platformData = {}) => {
  const history = getRatingHistory(platformData);
  if (!history.length) return getNumber(platformData.rating || platformData.currentRating || 0);
  const latest = history[history.length - 1];
  return getNumber(latest.rating || latest.newRating || latest.currentRating || platformData.rating || 0);
};
// ---------------------------------

const calculateStarRating = ({ totalSolved, platformsLinked, contestCount, githubRepos, maxRating }) => {
  let score = 2.5 + Math.min(2.2, totalSolved / 250) + Math.min(1.2, platformsLinked * 0.3) + Math.min(1.4, contestCount / 20) + Math.min(1.1, githubRepos / 10) + Math.min(1.6, maxRating / 1400);
  return Math.max(1, Math.min(10, Number(score.toFixed(1))));
};

const getOverviewSummary = ({ name, totalSolved, platformsLinked, contestCount, githubRepos, maxRating, topTopics, starRating }) => {
  const strongestTopic = topTopics?.[0]?.[0];
  if (starRating >= 8.5) return `${name} exhibits a strong engineering profile characterized by solid problem-solving consistency, active competitive programming participation, and clear technical project signals on GitHub. This portfolio demonstrates strong readiness for technical screening.`;
  if (starRating >= 7) return `${name} presents a reliable software engineering foundation with active coding metrics${strongestTopic ? ` and focus in ${strongestTopic}` : ""}. Continued contest participation and well-documented GitHub projects will further strengthen this profile.`;
  if (starRating >= 5.5) return `${name} is actively building a solid technical background across ${platformsLinked} platforms. To accelerate readiness, maintaining a consistent problem-solving streak and publishing more structured projects is recommended.`;
  return `${name} has recently established a technical tracking portfolio. Focusing on foundational data structures, engaging in regular problem-solving, and documenting early projects will help rapidly build profile strength.`;
};

const PublicPortfolio = () => {
  const { username } = useParams();
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const [data, setData] = useState(null);
  const [githubProjects, setGithubProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const platforms = data?.stats?.platforms || {};
  const topics = data?.stats?.topics || {};
  const difficulty = data?.stats?.difficulty || {};
  const personal = data?.personal || {};

  const platformEntries = useMemo(() => Object.entries(platforms).map(([platform, platformData]) => {
    const handle = platformData?.handle || personal?.[platform] || personal?.[`${platform}Handle`] || "";
    return { 
      platform, 
      label: platformLabels[platform] || platform, 
      data: platformData || {}, 
      handle, 
      solved: platform === "github" ? getNumber(platformData?.publicRepos || platformData?.totalRepos) : getNumber(platformData?.totalSolved), 
      profileUrl: getPlatformProfileUrl(platform, handle), 
      Icon: platformIcons[platform] || Code 
    };
  }), [platforms, personal]);

  const linkedPlatforms = platformEntries.filter((item) => item.handle || item.solved > 0).length;
  const topTopics = Object.entries(topics).sort((a, b) => getNumber(b[1]) - getNumber(a[1])).slice(0, 15);
  const totalSolved = getNumber(data?.stats?.totalSolved);
  const githubHandle = personal.github || platforms.github?.handle || personal.githubHandle || "";

  const contestStats = useMemo(() => ["leetcode", "codeforces", "codechef"].map((platform) => {
    const pd = platforms[platform] || {};
    return { 
      platform, 
      label: platformLabels[platform], 
      handle: pd.handle || personal?.[`${platform}Handle`] || "", 
      currentRating: getLatestRatingFromHistory(pd), 
      maxRating: getMaxRatingFromHistory(pd), 
      rank: pd.rank || pd.badge || "--", 
      contests: getContestCount(pd), 
      profileUrl: getPlatformProfileUrl(platform, pd.handle || personal?.[`${platform}Handle`] || "") 
    };
  }), [platforms, personal]);

  const totalContestCount = contestStats.reduce((sum, item) => sum + item.contests, 0);
  const maxRatingOverall = Math.max(0, ...contestStats.map((item) => item.maxRating));
  const githubReposCount = getNumber(platforms.github?.publicRepos || platforms.github?.totalRepos || githubProjects.length);
  
  const starRating = calculateStarRating({ totalSolved, platformsLinked: linkedPlatforms, contestCount: totalContestCount, githubRepos: githubReposCount, maxRating: maxRatingOverall });
  const aiSummary = getOverviewSummary({ name: personal.name || personal.username || username || "The candidate", totalSolved, platformsLinked: linkedPlatforms, contestCount: totalContestCount, githubRepos: githubReposCount, maxRating: maxRatingOverall, topTopics, starRating });

  useEffect(() => {
    const fetchPublicData = async () => {
      setLoading(true); setError("");
      try { const res = await api.get(`/profile/u/${encodeURIComponent(username)}`); setData(res.data); } 
      catch (err) { setData(null); setError(err.response?.data?.message || "Profile not found or private."); } 
      finally { setLoading(false); }
    };
    fetchPublicData();
  }, [username]);

  useEffect(() => {
    if (!githubHandle) return;
    const fetchGithubProjects = async () => {
      setProjectsLoading(true);
      try {
        const res = await fetch(`https://api.github.com/users/${encodeURIComponent(githubHandle)}/repos?sort=updated&per_page=6`);
        if (!res.ok) throw new Error("Fetch failed");
        const repos = await res.json();
        setGithubProjects(repos.filter((repo) => !repo.fork).slice(0, 6).map((repo) => ({ name: repo.name, description: repo.description || "No description provided.", language: repo.language || "Code", stars: getNumber(repo.stargazers_count), forks: getNumber(repo.forks_count), url: repo.html_url, updatedAt: repo.updated_at })));
      } catch (err) { setGithubProjects([]); } finally { setProjectsLoading(false); }
    };
    fetchGithubProjects();
  }, [githubHandle]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setCopied(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-200">
      <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
      <p className="text-sm font-semibold text-zinc-500">Loading Portfolio...</p>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-zinc-950 text-zinc-200">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-6"><AlertTriangle size={28} /></div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">Unavailable</h1>
      <p className="text-zinc-400 mb-8 max-w-sm">{error || "This profile doesn't exist or is currently set to private."}</p>
      <Link to="/" className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-bold hover:bg-zinc-200 transition-colors">Return Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans">
      <nav className="border-b border-white/[0.04] bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">CG</div>
            <p className="font-bold text-sm text-white">Career Guru <span className="text-zinc-500 font-medium ml-2 hidden sm:inline-block">/ Public Portfolio</span></p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-zinc-400 hover:text-white transition-colors">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={copyToClipboard} className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-xs font-semibold transition-colors">
              {copied ? <ClipboardCheck size={14} /> : <Share2 size={14} />} {copied ? "Copied" : "Share"}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 py-10 md:py-16">
        
        {/* Profile Header */}
        <section className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-sm">
          <img src={personal.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(personal.name || personal.username || "User")}&background=2563eb&color=fff`} className="w-32 h-32 rounded-full object-cover border-4 border-zinc-800 shadow-md shrink-0" alt="Profile" />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">{personal.name || personal.username || "Developer"}</h1>
            <p className="text-base text-zinc-400 font-medium mb-4 max-w-2xl">{personal.bio || "Software engineering and problem solving portfolio."}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
              {(personal.skills || ["Software Engineering"]).map((skill) => (
                <span key={skill} className="px-3 py-1 bg-zinc-800 border border-white/[0.05] rounded-lg text-xs font-semibold text-zinc-300">{skill}</span>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {githubHandle && <a href={getPlatformProfileUrl("github", githubHandle)} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 text-sm font-semibold hover:bg-zinc-700 transition-colors text-white"><Github size={16}/> GitHub</a>}
              {personal.linkedin && <a href={personal.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 text-sm font-semibold hover:bg-zinc-700 transition-colors text-white"><ExternalLink size={16}/> LinkedIn</a>}
              {personal.resumeUrl && <a href={personal.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-sm font-bold hover:bg-blue-500 transition-colors text-white">Resume</a>}
            </div>
          </div>
          <div className="w-full md:w-auto min-w-[200px] p-5 rounded-2xl bg-zinc-800/40 border border-white/[0.04] text-center md:text-left">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Profile Score</p>
            <div className="flex items-end justify-center md:justify-start gap-1 mb-2">
              <span className="text-4xl font-bold text-white tracking-tight leading-none">{starRating}</span>
              <span className="text-lg font-semibold text-zinc-500 mb-1">/10</span>
            </div>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">Derived from coding consistency, metrics, and GitHub activity.</p>
          </div>
        </section>

        {/* AI Summary */}
        <section className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 mb-8 flex items-start gap-4">
          <ShieldCheck size={24} className="text-blue-500 shrink-0 mt-1" />
          <div>
            <h2 className="text-sm font-bold text-white mb-1">Profile Overview</h2>
            <p className="text-sm text-zinc-300 leading-relaxed font-medium">{aiSummary}</p>
          </div>
        </section>

        {/* High-Level Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatBox label="Total Solved" value={formatCompact(totalSolved)} />
          <StatBox label="Active Platforms" value={linkedPlatforms} />
          <StatBox label="Contests" value={totalContestCount} />
          <StatBox label="Max Rating" value={maxRatingOverall || "--"} />
          <StatBox label="Public Repos" value={githubReposCount || "--"} />
        </div>

        {/* Detailed Stats Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <section className="lg:col-span-2 bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2"><BarChart3 size={16} className="text-blue-500"/> Platform Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platformEntries.filter((p) => p.platform !== "github").map(({ platform, label, data: pd, profileUrl }) => (
                <div key={platform} className="bg-zinc-800/30 border border-white/[0.03] rounded-2xl p-5">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-zinc-200">{label}</span>
                    {profileUrl && <a href={profileUrl} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white"><ExternalLink size={14}/></a>}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <MiniStat label="Solved" value={formatCompact(pd.totalSolved)} />
                    <MiniStat label="Rating" value={pd.rating || "--"} />
                    <MiniStat label="Max" value={pd.maxRating || "--"} />
                    <MiniStat label="Contests" value={getContestCount(pd)} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="lg:col-span-1 bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2"><Target size={16} className="text-blue-500"/> Distribution</h3>
            <div className="space-y-5">
              <DifficultyBar label="Easy" value={difficulty.easy} total={getNumber(difficulty.easy) + getNumber(difficulty.medium) + getNumber(difficulty.hard)} color="bg-emerald-500" />
              <DifficultyBar label="Medium" value={difficulty.medium} total={getNumber(difficulty.easy) + getNumber(difficulty.medium) + getNumber(difficulty.hard)} color="bg-blue-500" />
              <DifficultyBar label="Hard" value={difficulty.hard} total={getNumber(difficulty.easy) + getNumber(difficulty.medium) + getNumber(difficulty.hard)} color="bg-red-500" />
            </div>
          </section>
        </div>

        {/* Detailed Stats Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <section className="lg:col-span-1 bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2"><Layers size={16} className="text-blue-500"/> Strong Topics</h3>
            {topTopics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {topTopics.map(([topic, count]) => (
                  <span key={topic} className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-white/[0.03] text-xs font-semibold text-zinc-300 capitalize flex items-center gap-2">
                    {topic} <span className="opacity-50">{count}</span>
                  </span>
                ))}
              </div>
            ) : <p className="text-sm text-zinc-500 font-medium">No topic data available.</p>}
          </section>

          <section className="lg:col-span-2 bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2"><Github size={16} className="text-zinc-300"/> GitHub Projects</h3>
            {projectsLoading ? <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-zinc-500" /></div> : 
             githubProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {githubProjects.map(repo => (
                  <a key={repo.url} href={repo.url} target="_blank" rel="noreferrer" className="block p-4 rounded-2xl bg-zinc-800/30 border border-white/[0.03] hover:border-zinc-500/50 transition-colors">
                    <h4 className="font-bold text-zinc-200 text-sm truncate flex justify-between items-center">{repo.name} <ExternalLink size={12} className="text-zinc-500"/></h4>
                    <p className="text-xs text-zinc-400 mt-1.5 mb-3 line-clamp-2">{repo.description}</p>
                    <div className="flex items-center gap-3 text-xs font-semibold text-zinc-500">
                      <span className="flex items-center gap-1"><Code size={12}/>{repo.language}</span>
                      <span className="flex items-center gap-1"><Star size={12}/>{repo.stars}</span>
                      {repo.updatedAt && <span className="flex items-center gap-1"><CalendarDays size={12}/>{new Date(repo.updatedAt).toLocaleDateString(undefined, {month:'short', year:'numeric'})}</span>}
                    </div>
                  </a>
                ))}
              </div>
            ) : <p className="text-sm text-zinc-500 font-medium">No public repositories found.</p>}
          </section>
        </div>

      </main>
    </div>
  );
};

/* Helper UI Components */
const StatBox = ({ label, value }) => (
  <div className="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-5 text-center shadow-sm">
    <p className="text-3xl font-bold text-white tracking-tight mb-1">{value}</p>
    <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">{label}</p>
  </div>
);

const MiniStat = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">{label}</span>
    <span className="text-base font-bold text-white">{value}</span>
  </div>
);

const DifficultyBar = ({ label, value, total, color }) => {
  const pct = total ? Math.round((getNumber(value) / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-zinc-300">{label}</span>
        <span className="text-xs font-bold text-zinc-400">{value || 0} <span className="font-medium">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default PublicPortfolio;