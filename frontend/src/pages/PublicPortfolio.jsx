import { useContext, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { ThemeContext } from "../context/ThemeContext";
import {
  Github,
  ExternalLink,
  Award,
  Code,
  Zap,
  Globe,
  Share2,
  ClipboardCheck,
  Loader2,
  AlertTriangle,
  Trophy,
  Flame,
  Star,
  Moon,
  Sun,
  BarChart3,
  GitFork,
  Eye,
  CalendarDays,
  Target,
  Activity,
  Sparkles,
  Brain,
  Layers,
  Medal,
} from "lucide-react";

const platformLabels = {
  leetcode: "LeetCode",
  codeforces: "Codeforces",
  codechef: "CodeChef",
  github: "GitHub",
};

const platformIcons = {
  leetcode: Code,
  codeforces: Trophy,
  codechef: Flame,
  github: Github,
};

const platformTones = {
  leetcode: "text-[var(--app-accent)]",
  codeforces: "text-blue-500",
  codechef: "text-orange-500",
  github: "text-[var(--app-text)]",
};

const getNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCompact = (value) => {
  const num = getNumber(value);

  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;

  return String(num);
};

const normalizeHandle = (value) => String(value || "").trim();

const getPlatformProfileUrl = (platform, handle) => {
  const cleanHandle = normalizeHandle(handle);

  if (!cleanHandle) return "";

  const urls = {
    leetcode: `https://leetcode.com/u/${cleanHandle}/`,
    codeforces: `https://codeforces.com/profile/${cleanHandle}`,
    codechef: `https://www.codechef.com/users/${cleanHandle}`,
    github: `https://github.com/${cleanHandle}`,
  };

  return urls[platform] || "";
};

const getPlatformSolved = (platform, data = {}) => {
  if (platform === "github") {
    return getNumber(data.publicRepos || data.totalRepos || data.totalReposAnalyzed || 0);
  }

  return getNumber(data.totalSolved || data.solved || 0);
};

const getPlatformSubLabel = (platform, data = {}) => {
  if (platform === "github") {
    return `${getNumber(data.followers || 0)} followers · ${getNumber(
      data.publicRepos || data.totalRepos || 0
    )} repos`;
  }

  const rating = getNumber(data.rating || data.currentRating || 0);
  const maxRating = getNumber(data.maxRating || data.peakRating || 0);

  if (rating || maxRating) {
    return `Rating ${rating || "--"} · Max ${maxRating || "--"}`;
  }

  return data.rank || data.status || "Coding profile";
};

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

  const fromHistory = Math.max(
    0,
    ...history.map((item) =>
      getNumber(item.rating || item.newRating || item.currentRating || item.rankRating || 0)
    )
  );

  return Math.max(
    fromHistory,
    getNumber(platformData.maxRating || platformData.peakRating || 0)
  );
};

const getLatestRatingFromHistory = (platformData = {}) => {
  const history = getRatingHistory(platformData);

  if (!history.length) {
    return getNumber(platformData.rating || platformData.currentRating || 0);
  }

  const latest = history[history.length - 1];

  return getNumber(
    latest.rating || latest.newRating || latest.currentRating || platformData.rating || 0
  );
};

const calculateStarRating = ({ totalSolved, platformsLinked, contestCount, githubRepos, maxRating }) => {
  let score = 2.5;

  score += Math.min(2.2, totalSolved / 250);
  score += Math.min(1.2, platformsLinked * 0.3);
  score += Math.min(1.4, contestCount / 20);
  score += Math.min(1.1, githubRepos / 10);
  score += Math.min(1.6, maxRating / 1400);

  return Math.max(1, Math.min(10, Number(score.toFixed(1))));
};

const getCareerGuruSummary = ({
  name,
  totalSolved,
  platformsLinked,
  contestCount,
  githubRepos,
  maxRating,
  topTopics,
  starRating,
}) => {
  const strongestTopic = topTopics?.[0]?.[0];

  if (starRating >= 8.5) {
    return `${name} shows a strong engineering profile with serious coding consistency, visible competitive programming exposure, and project signals through GitHub. The profile is already strong for SDE internship screening, especially if the projects are polished and well documented.`;
  }

  if (starRating >= 7) {
    return `${name} has a solid software engineering profile with good problem-solving volume${
      strongestTopic ? ` and visible strength in ${strongestTopic}` : ""
    }. With more contest consistency, stronger GitHub project documentation, and focused revision, this profile can become highly competitive for internship roles.`;
  }

  if (starRating >= 5.5) {
    return `${name} has a developing coding profile with useful early signals across ${platformsLinked} platform(s). The next improvement area is to increase medium-level problem solving, maintain contest participation, and showcase stronger GitHub projects.`;
  }

  return `${name} has started building a public coding profile. To make this portfolio stronger, the focus should be on consistent DSA practice, more contest participation, and publishing polished GitHub projects with clear READMEs and live demos.`;
};

const PublicPortfolio = () => {
  const { username } = useParams();
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  const [data, setData] = useState(null);
  const [githubProjects, setGithubProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const platforms = data?.stats?.platforms || {};
  const topics = data?.stats?.topics || {};
  const difficulty = data?.stats?.difficulty || {};
  const personal = data?.personal || {};

  const platformEntries = useMemo(() => {
    return Object.entries(platforms).map(([platform, value]) => {
      const platformData = value || {};
      const handle =
        platformData.handle ||
        personal?.[platform] ||
        personal?.[`${platform}Handle`] ||
        "";

      return {
        platform,
        label: platformLabels[platform] || platform,
        data: platformData,
        handle,
        solved: getPlatformSolved(platform, platformData),
        subLabel: getPlatformSubLabel(platform, platformData),
        profileUrl: getPlatformProfileUrl(platform, handle),
        Icon: platformIcons[platform] || Code,
      };
    });
  }, [platforms, personal]);

  const linkedPlatforms = useMemo(() => {
    return platformEntries.filter((item) => item.handle || item.solved > 0).length;
  }, [platformEntries]);

  const topTopics = useMemo(() => {
    return Object.entries(topics)
      .sort((a, b) => getNumber(b[1]) - getNumber(a[1]))
      .slice(0, 15);
  }, [topics]);

  const totalDifficulty =
    getNumber(difficulty.easy) +
    getNumber(difficulty.medium) +
    getNumber(difficulty.hard);

  const totalSolved = getNumber(data?.stats?.totalSolved);
  const githubHandle =
    personal.github ||
    platforms.github?.handle ||
    personal.githubHandle ||
    "";

  const githubReposCount = getNumber(
    platforms.github?.publicRepos ||
      platforms.github?.totalRepos ||
      platforms.github?.totalReposAnalyzed ||
      githubProjects.length
  );

  const contestStats = useMemo(() => {
    const contestPlatforms = ["leetcode", "codeforces", "codechef"];

    const rows = contestPlatforms.map((platform) => {
      const platformData = platforms[platform] || {};

      return {
        platform,
        label: platformLabels[platform] || platform,
        handle: platformData.handle || personal?.[`${platform}Handle`] || "",
        currentRating: getLatestRatingFromHistory(platformData),
        maxRating: getMaxRatingFromHistory(platformData),
        rank: platformData.rank || platformData.badge || "--",
        contests: getContestCount(platformData),
        profileUrl: getPlatformProfileUrl(
          platform,
          platformData.handle || personal?.[`${platform}Handle`] || ""
        ),
      };
    });

    return rows;
  }, [platforms, personal]);

  const totalContestCount = useMemo(() => {
    return contestStats.reduce((sum, item) => sum + getNumber(item.contests), 0);
  }, [contestStats]);

  const maxRatingOverall = useMemo(() => {
    return Math.max(0, ...contestStats.map((item) => getNumber(item.maxRating)));
  }, [contestStats]);

  const starRating = useMemo(() => {
    return calculateStarRating({
      totalSolved,
      platformsLinked: linkedPlatforms,
      contestCount: totalContestCount,
      githubRepos: githubReposCount,
      maxRating: maxRatingOverall,
    });
  }, [totalSolved, linkedPlatforms, totalContestCount, githubReposCount, maxRatingOverall]);

  const aiSummary = useMemo(() => {
    return getCareerGuruSummary({
      name: personal.name || personal.username || username || "This candidate",
      totalSolved,
      platformsLinked: linkedPlatforms,
      contestCount: totalContestCount,
      githubRepos: githubReposCount,
      maxRating: maxRatingOverall,
      topTopics,
      starRating,
    });
  }, [
    personal.name,
    personal.username,
    username,
    totalSolved,
    linkedPlatforms,
    totalContestCount,
    githubReposCount,
    maxRatingOverall,
    topTopics,
    starRating,
  ]);

  useEffect(() => {
    const fetchPublicData = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await api.get(`/profile/u/${encodeURIComponent(username)}`);
        setData(res.data);
      } catch (err) {
        setData(null);
        setError(
          err.response?.data?.message ||
            "Profile not found or set to private."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, [username]);

  useEffect(() => {
    const fromBackend =
      platforms.github?.pinnedRepos ||
      platforms.github?.repos ||
      platforms.github?.deepRepos ||
      [];

    if (Array.isArray(fromBackend) && fromBackend.length > 0) {
      setGithubProjects(
        fromBackend.slice(0, 6).map((repo) => ({
          name: repo.name,
          description: repo.description || "No description provided.",
          language: repo.language || "Code",
          stars: getNumber(repo.stars || repo.stargazers_count),
          forks: getNumber(repo.forks || repo.forks_count),
          url: repo.url || repo.html_url,
          updatedAt: repo.updatedAt || repo.updated_at,
          topics: repo.topics || [],
        }))
      );
      return;
    }

    const fetchGithubProjects = async () => {
      if (!githubHandle) return;

      setProjectsLoading(true);

      try {
        const res = await fetch(
          `https://api.github.com/users/${encodeURIComponent(
            githubHandle
          )}/repos?sort=updated&per_page=6`
        );

        if (!res.ok) throw new Error("GitHub repos fetch failed");

        const repos = await res.json();

        setGithubProjects(
          repos
            .filter((repo) => !repo.fork)
            .slice(0, 6)
            .map((repo) => ({
              name: repo.name,
              description: repo.description || "No description provided.",
              language: repo.language || "Code",
              stars: getNumber(repo.stargazers_count),
              forks: getNumber(repo.forks_count),
              url: repo.html_url,
              updatedAt: repo.updated_at,
              topics: repo.topics || [],
            }))
        );
      } catch (err) {
        setGithubProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchGithubProjects();
  }, [githubHandle, platforms.github]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setCopied(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--app-bg)] text-[var(--app-text)] px-6">
        <Loader2 size={34} className="animate-spin text-[var(--app-accent)] mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--app-muted)]">
          Building Portfolio
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-[var(--app-bg)] text-[var(--app-text)]">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-5">
          <AlertTriangle size={24} />
        </div>

        <h1 className="text-5xl font-black tracking-tight mb-3">404</h1>
        <p className="text-lg font-bold mb-2">Public portfolio unavailable</p>
        <p className="text-sm text-[var(--app-muted)] max-w-md mb-7">
          {error || "Profile not found or set to private."}
        </p>

        <Link
          to="/"
          className="app-btn-primary px-5 py-3 text-xs uppercase tracking-widest"
        >
          Go to Home
          <ExternalLink size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <nav className="sticky top-0 z-50 border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-bg)_86%,transparent)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 py-4 flex justify-between items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[var(--app-accent)] text-zinc-950 flex items-center justify-center font-black">
              CG
            </div>

            <div>
              <p className="font-black tracking-tight leading-none">
                Career Guru
              </p>
              <p className="text-[10px] text-[var(--app-faint)] font-bold uppercase tracking-[0.18em] mt-1">
                Public Portfolio
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="h-10 w-10 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-2)] transition-all flex items-center justify-center"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              type="button"
              onClick={copyToClipboard}
              className="app-btn-secondary px-4 py-2 text-xs"
            >
              {copied ? <ClipboardCheck size={14} /> : <Share2 size={14} />}
              {copied ? "Copied" : "Share"}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-5 py-10 md:py-14">
        <section className="app-card p-6 md:p-8 mb-6 overflow-hidden relative">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[var(--app-accent)]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-7 text-center lg:text-left">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-[var(--app-accent)]/30 rounded-[2rem] blur-lg" />
              <img
                src={
                  personal.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    personal.name || personal.username || "User"
                  )}&background=ffa116&color=111827`
                }
                className="relative w-32 h-32 md:w-36 md:h-36 rounded-[2rem] object-cover border-4 border-[var(--app-surface)] shadow-xl"
                alt={personal.name || "Profile"}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-3">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
                  {personal.name || personal.username || "Coder"}
                </h1>

                <span className="w-fit mx-auto lg:mx-0 app-chip border-emerald-500/20 text-emerald-500 bg-emerald-500/10">
                  Public Profile
                </span>
              </div>

              <p className="text-base md:text-lg text-[var(--app-muted)] max-w-3xl leading-8 mb-5">
                {personal.bio ||
                  "Competitive programmer and software engineering aspirant."}
              </p>

              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {(personal.skills || []).length > 0 ? (
                  personal.skills.map((skill) => (
                    <span key={skill} className="app-chip">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="app-chip">Software Engineering</span>
                )}
              </div>

              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mt-6">
                {githubHandle && (
                  <a
                    href={getPlatformProfileUrl("github", githubHandle)}
                    target="_blank"
                    rel="noreferrer"
                    className="app-btn-secondary px-4 py-2 text-xs"
                  >
                    <Github size={14} />
                    GitHub
                  </a>
                )}

                {personal.linkedin && (
                  <a
                    href={personal.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="app-btn-secondary px-4 py-2 text-xs"
                  >
                    <ExternalLink size={14} />
                    LinkedIn
                  </a>
                )}

                {personal.resumeUrl && (
                  <a
                    href={personal.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="app-btn-primary px-4 py-2 text-xs"
                  >
                    Resume
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>

            <div className="w-full lg:w-80 shrink-0 app-panel p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] text-[var(--app-muted)] font-black uppercase tracking-widest">
                  Career Guru Rating
                </p>
                <Sparkles size={16} className="text-[var(--app-accent)]" />
              </div>

              <div className="flex items-end gap-2 mb-3">
                <p className="text-5xl font-black tracking-tight">
                  {starRating}
                </p>
                <p className="text-lg text-[var(--app-muted)] font-black mb-1">
                  /10
                </p>
              </div>

              <StarRating value={starRating} />

              <p className="text-xs text-[var(--app-muted)] leading-6 mt-4">
                AI-style rating based on coding volume, contests, platform coverage,
                rating signals, and GitHub activity.
              </p>
            </div>
          </div>
        </section>

        <section className="app-card p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-2xl bg-[var(--app-accent)]/10 border border-[var(--app-accent)]/20 flex items-center justify-center shrink-0">
              <Brain size={20} className="text-[var(--app-accent)]" />
            </div>

            <div>
              <p className="text-[10px] text-[var(--app-muted)] font-black uppercase tracking-[0.2em] mb-2">
                Career Guru AI Summary
              </p>
              <p className="text-sm md:text-base text-[var(--app-text)] leading-8">
                {aiSummary}
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            icon={<Award className="text-[var(--app-accent)]" size={18} />}
            label="Total Solved"
            value={formatCompact(totalSolved)}
          />
          <StatCard
            icon={<Zap className="text-orange-500" size={18} />}
            label="Platforms"
            value={linkedPlatforms}
          />
          <StatCard
            icon={<Trophy className="text-blue-500" size={18} />}
            label="Contests"
            value={totalContestCount}
          />
          <StatCard
            icon={<Medal className="text-purple-500" size={18} />}
            label="Max Rating"
            value={maxRatingOverall || "--"}
          />
          <StatCard
            icon={<Github size={18} />}
            label="GitHub Repos"
            value={githubReposCount || "--"}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <section className="app-card p-6 xl:col-span-1">
            <SectionTitle title="Platform Activity" icon={<Activity size={16} />} />

            <div className="space-y-3">
              {platformEntries.map(
                ({ platform, label, data: platformData, solved, subLabel, Icon, profileUrl, handle }) => (
                  <a
                    key={platform}
                    href={profileUrl || undefined}
                    target={profileUrl ? "_blank" : undefined}
                    rel={profileUrl ? "noreferrer" : undefined}
                    className="app-panel p-4 flex items-center justify-between gap-4 hover:border-[var(--app-accent)] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] flex items-center justify-center">
                        <Icon size={17} className={platformTones[platform]} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-black truncate flex items-center gap-2">
                          {label}
                          {profileUrl && <ExternalLink size={12} />}
                        </p>
                        <p className="text-[11px] text-[var(--app-muted)] truncate">
                          {handle ? `@${handle}` : subLabel}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xl font-black italic">
                        {formatCompact(solved)}
                      </p>
                      <p className="text-[9px] text-[var(--app-faint)] font-black uppercase tracking-widest">
                        {platform === "github" ? "Repos" : "Solved"}
                      </p>
                    </div>
                  </a>
                )
              )}
            </div>
          </section>

          <section className="app-card p-6 xl:col-span-2">
            <SectionTitle title="Detailed Coding Stats" icon={<BarChart3 size={16} />} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {platformEntries
                .filter((item) => item.platform !== "github")
                .map(({ platform, label, data: platformData, profileUrl }) => (
                  <a
                    key={platform}
                    href={profileUrl || undefined}
                    target={profileUrl ? "_blank" : undefined}
                    rel={profileUrl ? "noreferrer" : undefined}
                    className="app-panel p-5 hover:border-[var(--app-accent)] transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-black">{label}</p>
                      {profileUrl && <ExternalLink size={14} className="text-[var(--app-muted)]" />}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <MiniStat label="Solved" value={formatCompact(platformData.totalSolved)} />
                      <MiniStat label="Rating" value={platformData.rating || "--"} />
                      <MiniStat label="Max" value={platformData.maxRating || "--"} />
                      <MiniStat label="Rank" value={platformData.rank || "--"} />
                      <MiniStat label="Easy" value={platformData.easy || 0} />
                      <MiniStat label="Medium" value={platformData.medium || 0} />
                      <MiniStat label="Hard" value={platformData.hard || 0} />
                      <MiniStat label="Contests" value={getContestCount(platformData)} />
                    </div>
                  </a>
                ))}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <section className="app-card p-6 xl:col-span-2">
            <SectionTitle title="Contest Ratings" icon={<Trophy size={16} />} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contestStats.map((item) => (
                <a
                  key={item.platform}
                  href={item.profileUrl || undefined}
                  target={item.profileUrl ? "_blank" : undefined}
                  rel={item.profileUrl ? "noreferrer" : undefined}
                  className="app-panel p-5 hover:border-[var(--app-accent)] transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-black">{item.label}</p>
                      <p className="text-[11px] text-[var(--app-muted)] truncate">
                        {item.handle ? `@${item.handle}` : "No handle"}
                      </p>
                    </div>
                    <Trophy size={18} className={platformTones[item.platform]} />
                  </div>

                  <div className="space-y-3">
                    <RatingRow label="Current Rating" value={item.currentRating || "--"} />
                    <RatingRow label="Max Rating" value={item.maxRating || "--"} />
                    <RatingRow label="Contests" value={item.contests || 0} />
                    <RatingRow label="Rank" value={item.rank || "--"} />
                  </div>
                </a>
              ))}
            </div>
          </section>

          <section className="app-card p-6">
            <SectionTitle title="Difficulty Distribution" icon={<Target size={16} />} />

            {totalDifficulty > 0 ? (
              <div className="space-y-4">
                <DifficultyBar label="Easy" value={difficulty.easy} total={totalDifficulty} color="bg-emerald-500" />
                <DifficultyBar label="Medium" value={difficulty.medium} total={totalDifficulty} color="bg-[var(--app-accent)]" />
                <DifficultyBar label="Hard" value={difficulty.hard} total={totalDifficulty} color="bg-red-500" />
              </div>
            ) : (
              <EmptyBox text="No difficulty data found yet." />
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <section className="app-card p-6 xl:col-span-1">
            <SectionTitle title="Topic Expertise" icon={<Layers size={16} />} />

            {topTopics.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {topTopics.map(([topic, count]) => (
                  <div
                    key={topic}
                    className="px-4 py-3 rounded-2xl bg-[var(--app-surface-2)] border border-[var(--app-border)] hover:border-[var(--app-accent)] transition-all flex items-center gap-3"
                  >
                    <span className="capitalize text-sm font-bold">
                      {topic}
                    </span>
                    <span className="text-xs bg-[var(--app-surface)] border border-[var(--app-border)] px-2 py-0.5 rounded-lg font-black text-[var(--app-muted)]">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBox text="No topic data found yet. Sync platforms to show topic expertise." />
            )}
          </section>

          <section className="app-card p-6 xl:col-span-2">
            <SectionTitle title="GitHub Projects" icon={<Github size={16} />} />

            {projectsLoading ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-[var(--app-accent)]" />
              </div>
            ) : githubProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {githubProjects.map((repo) => (
                  <a
                    key={repo.url || repo.name}
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="app-panel p-5 hover:border-[var(--app-accent)] transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <p className="font-black truncate flex items-center gap-2">
                          {repo.name}
                          <ExternalLink size={13} className="opacity-60 group-hover:opacity-100" />
                        </p>
                        <p className="text-xs text-[var(--app-muted)] mt-2 line-clamp-2 leading-5">
                          {repo.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--app-muted)] mt-4">
                      <span className="inline-flex items-center gap-1">
                        <Code size={12} />
                        {repo.language || "Code"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Star size={12} />
                        {repo.stars}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <GitFork size={12} />
                        {repo.forks}
                      </span>
                      {repo.updatedAt && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={12} />
                          {new Date(repo.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {Array.isArray(repo.topics) && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {repo.topics.slice(0, 4).map((topic) => (
                          <span key={topic} className="app-chip">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <EmptyBox text="No GitHub projects found. Add a valid GitHub handle or sync GitHub data." />
            )}
          </section>
        </div>

        <footer className="mt-12 text-center text-[var(--app-faint)] border-t border-[var(--app-border)] pt-8">
          <p className="text-sm font-medium">
            Generated by Career Guru • Public portfolio snapshot
          </p>
        </footer>
      </main>
    </div>
  );
};

const SectionTitle = ({ title, icon }) => (
  <h3 className="text-sm font-black mb-5 flex items-center gap-3 uppercase tracking-[0.18em] text-[var(--app-muted)]">
    <span className="w-1.5 h-5 bg-[var(--app-accent)] rounded-full" />
    {icon}
    {title}
  </h3>
);

const StarRating = ({ value }) => {
  const rounded = Math.round(value);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 10 }).map((_, index) => (
        <Star
          key={index}
          size={15}
          className={
            index < rounded
              ? "fill-[var(--app-accent)] text-[var(--app-accent)]"
              : "text-[var(--app-border)]"
          }
        />
      ))}
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="app-card p-5">
    <div className="flex items-center gap-3 mb-3">
      <div className="h-9 w-9 rounded-xl bg-[var(--app-surface-2)] border border-[var(--app-border)] flex items-center justify-center">
        {icon}
      </div>
      <span className="text-[10px] font-black text-[var(--app-muted)] uppercase tracking-widest">
        {label}
      </span>
    </div>

    <div className="text-2xl md:text-3xl font-black tracking-tight truncate">
      {value}
    </div>
  </div>
);

const MiniStat = ({ label, value }) => (
  <div className="rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] p-3">
    <p className="text-[9px] text-[var(--app-muted)] font-black uppercase tracking-widest">
      {label}
    </p>
    <p className="text-lg font-black mt-1 truncate">{value}</p>
  </div>
);

const RatingRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 text-sm">
    <span className="text-[var(--app-muted)]">{label}</span>
    <span className="font-black">{value}</span>
  </div>
);

const DifficultyBar = ({ label, value, total, color }) => {
  const percentage = total ? Math.round((getNumber(value) / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-sm text-[var(--app-muted)] font-black">
          {value || 0} · {percentage}%
        </p>
      </div>
      <div className="h-2.5 rounded-full bg-[var(--app-surface-2)] overflow-hidden border border-[var(--app-border)]">
        <div
          className={`h-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const EmptyBox = ({ text }) => (
  <div className="rounded-2xl border border-dashed border-[var(--app-border)] p-8 text-center text-[var(--app-muted)] text-sm">
    {text}
  </div>
);

export default PublicPortfolio;