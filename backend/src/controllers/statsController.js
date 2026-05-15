const axios = require("axios");

const CodingProfile = require("../models/CodingProfile");
const Profile = require("../models/Profile");
const SolvedProblem = require("../models/SolvedProblem");
const GitHubRepo = require("../models/GitHubRepo");
const UserAnalyticsSnapshot = require("../models/UserAnalyticsSnapshot");

const { fetchLeetCode } = require("../services/platforms/leetcodeService");
const { fetchCodeforces } = require("../services/platforms/codeforcesService");
const { fetchCodechef } = require("../services/platforms/codechefService");

const normalizeDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const normalizeTag = (tag) => {
  const t = String(tag || "").toLowerCase().trim();

  if (t.includes("binary search")) return "binary search";
  if (t.includes("dynamic programming") || t === "dp") return "dp";
  if (t.includes("data structures")) return "data structures";
  if (t.includes("shortest")) return "shortest paths";
  if (t.includes("string")) return "string";
  if (t.includes("array")) return "array";
  if (t.includes("graph")) return "graph";
  if (t.includes("tree")) return "tree";
  if (t.includes("sort")) return "sorting";
  if (t.includes("search")) return "searching";
  if (t.includes("math")) return "math";
  if (t.includes("greedy")) return "greedy";
  if (t.includes("recursion")) return "recursion";

  return t || "general";
};

const toPlainObject = (value) => {
  if (!value) return {};

  if (value instanceof Map) {
    return Object.fromEntries(value);
  }

  if (typeof value.toObject === "function") {
    return value.toObject() || {};
  }

  if (typeof value === "object") {
    return value;
  }

  return {};
};

const calculateStreakFromDates = (dates) => {
  if (!Array.isArray(dates) || dates.length === 0) {
    return {
      currentStreak: 0,
      maxStreak: 0,
      activeDays: 0,
      lastActiveDate: "",
    };
  }

  const sortedAsc = [...new Set(dates)]
    .filter(Boolean)
    .sort((a, b) => new Date(a) - new Date(b));

  const sortedDesc = [...sortedAsc].sort((a, b) => new Date(b) - new Date(a));

  const today = normalizeDate(new Date());
  const yesterday = normalizeDate(new Date(Date.now() - 86400000));

  let currentStreak = 0;

  if (sortedDesc[0] === today || sortedDesc[0] === yesterday) {
    let expectedDate = new Date(sortedDesc[0]);

    for (const dateString of sortedDesc) {
      const currentDate = new Date(dateString);
      const diff = Math.round((expectedDate - currentDate) / 86400000);

      if (diff === 0 || diff === 1) {
        currentStreak += 1;
        expectedDate = currentDate;
      } else {
        break;
      }
    }
  }

  let maxStreak = 0;
  let running = 0;
  let previous = null;

  for (const dateString of sortedAsc) {
    const current = new Date(dateString);

    if (!previous) {
      running = 1;
    } else {
      const diff = Math.round((current - previous) / 86400000);
      running = diff === 1 ? running + 1 : 1;
    }

    maxStreak = Math.max(maxStreak, running);
    previous = current;
  }

  return {
    currentStreak,
    maxStreak,
    activeDays: sortedAsc.length,
    lastActiveDate: sortedDesc[0] || "",
  };
};

const getPlatformCurrentStreak = (platformData) => {
  return Number(
    platformData?.submissionsSummary?.currentStreak ||
      platformData?.streak ||
      calculateStreakFromDates(platformData?.dates || []).currentStreak ||
      0
  );
};

const getPlatformMaxStreak = (platformData) => {
  return Number(
    platformData?.submissionsSummary?.maxStreak ||
      platformData?.maxStreak ||
      calculateStreakFromDates(platformData?.dates || []).maxStreak ||
      0
  );
};

const getPlatformContestCount = (platformData) => {
  return Array.isArray(platformData?.ratingHistory)
    ? platformData.ratingHistory.length
    : 0;
};

const getPlatformUpcomingCount = (platformData) => {
  return Array.isArray(platformData?.upcomingContests)
    ? platformData.upcomingContests.length
    : 0;
};

const analyzeCompetency = (codingProfile) => {
  const platforms = ["leetcode", "codeforces", "codechef"];
  const multipliers = {
    leetcode: 1,
    codeforces: 1.5,
    codechef: 1.2,
  };

  const topicStats = {};

  platforms.forEach((platform) => {
    const platformData = codingProfile?.[platform];
    const topicWise = toPlainObject(platformData?.topicWise);

    Object.entries(topicWise).forEach(([topic, count]) => {
      const key = normalizeTag(topic);

      if (!topicStats[key]) {
        topicStats[key] = {
          weight: 0,
          lastSeen: "1970-01-01",
          count: 0,
        };
      }

      const numericCount = Number(count || 0);

      topicStats[key].count += numericCount;
      topicStats[key].weight += numericCount * multipliers[platform];

      const latest =
        Array.isArray(platformData?.dates) && platformData.dates.length > 0
          ? [...platformData.dates].sort().reverse()[0]
          : "1970-01-01";

      if (new Date(latest) > new Date(topicStats[key].lastSeen)) {
        topicStats[key].lastSeen = latest;
      }
    });
  });

  const today = new Date();

  return Object.entries(topicStats)
    .map(([topic, stats]) => {
      const daysIdleRaw = Math.floor((today - new Date(stats.lastSeen)) / 86400000);
      const daysIdle = Number.isFinite(daysIdleRaw) ? daysIdleRaw : 999;

      let decay = 1.0;
      if (daysIdle > 90) decay = 0.4;
      else if (daysIdle > 30) decay = 0.7;

      const score = Number((stats.weight * decay).toFixed(2));

      return {
        topic,
        score,
        count: stats.count,
        daysIdle,
      };
    })
    .sort((a, b) => a.score - b.score);
};

const buildCombinedAnalytics = (coding) => {
  const platforms = ["leetcode", "codeforces", "codechef"];

  let totalSolved = 0;
  const allDates = [];
  const combinedTopics = {};

  platforms.forEach((platform) => {
    const data = coding?.[platform] || {};

    totalSolved += Number(data.totalSolved || 0);

    if (Array.isArray(data.dates)) {
      allDates.push(...data.dates);
    }

    const topicWise = toPlainObject(data.topicWise);

    Object.entries(topicWise).forEach(([topic, count]) => {
      const key = normalizeTag(topic);
      combinedTopics[key] = (combinedTopics[key] || 0) + Number(count || 0);
    });
  });

  const sortedTopics = Object.entries(combinedTopics).sort((a, b) => b[1] - a[1]);

  const strongestTopics = sortedTopics.slice(0, 5).map(([topic]) => topic);
  const weakestTopics = sortedTopics.slice(-5).map(([topic]) => topic);

  const streakData = calculateStreakFromDates(allDates);
  const totalActiveDays = streakData.activeDays;

  const productionReadyRepos = Number(
    coding?.github?.projectSignals?.productionReadyRepos || 0
  );

  const readinessScore = Math.round(
    Math.min(totalSolved / 600, 1) * 35 +
      Math.min(totalActiveDays / 120, 1) * 25 +
      Math.min(Object.keys(combinedTopics).length / 25, 1) * 25 +
      Math.min(productionReadyRepos / 3, 1) * 15
  );

  return {
    totalSolved,
    totalActiveDays,
    strongestTopics,
    weakestTopics,
    readinessScore,
    currentStreak: streakData.currentStreak,
    maxStreak: streakData.maxStreak,
    lastComputedAt: new Date(),
  };
};

const buildPlatformOverview = (coding) => {
  const leetcode = coding?.leetcode || {};
  const codeforces = coding?.codeforces || {};
  const codechef = coding?.codechef || {};

  return [
    {
      platform: "leetcode",
      label: "LeetCode",
      totalSolved: Number(leetcode.totalSolved || 0),
      easy: Number(leetcode.easy || 0),
      medium: Number(leetcode.medium || 0),
      hard: Number(leetcode.hard || 0),
      currentRating: Number(leetcode.rating || 0),
      maxRating: Number(leetcode.maxRating || 0),
      rank: leetcode.rank || "",
      contests: getPlatformContestCount(leetcode),
      upcomingContests: getPlatformUpcomingCount(leetcode),
      currentStreak: getPlatformCurrentStreak(leetcode),
      maxStreak: getPlatformMaxStreak(leetcode),
      status: leetcode.status || "Pending Sync",
    },
    {
      platform: "codeforces",
      label: "Codeforces",
      totalSolved: Number(codeforces.totalSolved || 0),
      easy: Number(codeforces.easy || 0),
      medium: Number(codeforces.medium || 0),
      hard: Number(codeforces.hard || 0),
      currentRating: Number(codeforces.rating || 0),
      maxRating: Number(codeforces.maxRating || 0),
      rank: codeforces.rank || "",
      contests: getPlatformContestCount(codeforces),
      upcomingContests: getPlatformUpcomingCount(codeforces),
      currentStreak: getPlatformCurrentStreak(codeforces),
      maxStreak: getPlatformMaxStreak(codeforces),
      status: codeforces.status || "Pending Sync",
    },
    {
      platform: "codechef",
      label: "CodeChef",
      totalSolved: Number(codechef.totalSolved || 0),
      easy: Number(codechef.easy || 0),
      medium: Number(codechef.medium || 0),
      hard: Number(codechef.hard || 0),
      currentRating: Number(codechef.rating || 0),
      maxRating: Number(codechef.maxRating || 0),
      rank: codechef.rank || "",
      contests: getPlatformContestCount(codechef),
      upcomingContests: getPlatformUpcomingCount(codechef),
      currentStreak: getPlatformCurrentStreak(codechef),
      maxStreak: getPlatformMaxStreak(codechef),
      status: codechef.status || "Pending Sync",
    },
  ];
};

const createAnalyticsSnapshot = async (userId, codingProfile) => {
  if (!codingProfile) return;

  const today = normalizeDate(new Date());
  const combined = codingProfile.combined || buildCombinedAnalytics(codingProfile);

  await UserAnalyticsSnapshot.findOneAndUpdate(
    {
      userId,
      date: today,
    },
    {
      $set: {
        userId,
        date: today,

        totalSolved: Number(combined.totalSolved || 0),
        totalActiveDays: Number(combined.totalActiveDays || 0),
        readinessScore: Number(combined.readinessScore || 0),
        strongestTopics: combined.strongestTopics || [],
        weakestTopics: combined.weakestTopics || [],

        leetcode: codingProfile.leetcode || {},
        codeforces: codingProfile.codeforces || {},
        codechef: codingProfile.codechef || {},
        github: codingProfile.github || {},

        rawData: {
          combined,
          platformOverview: buildPlatformOverview(codingProfile),
        },
      },
    },
    {
      upsert: true,
      new: true,
    }
  );
};

const resolveHandle = async (userId, platform) => {
  const profile = await Profile.findOne({ userId });
  return profile?.[`${platform}Handle`]?.trim() || "";
};

const updateCodingProfilePlatform = async (userId, platform, platformData) => {
  const updated = await CodingProfile.findOneAndUpdate(
    { userId },
    {
      $set: {
        userId,
        [platform]: platformData,
        lastSynced: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );

  const combined = buildCombinedAnalytics(updated);

  const finalProfile = await CodingProfile.findOneAndUpdate(
    { userId },
    {
      $set: {
        combined,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  await createAnalyticsSnapshot(userId, finalProfile);

  return finalProfile;
};

const syncPlatform = async ({ userId, platform, handle, fetcher }) => {
  const data = await fetcher(userId, handle);
  const profile = await updateCodingProfilePlatform(userId, platform, data);

  return {
    platform,
    data: profile[platform],
  };
};

const scoreRepoQuality = (repo, languages = {}, readmeExists = false) => {
  let score = 0;

  if (readmeExists) score += 25;
  if (repo.description) score += 10;
  if (repo.homepage) score += 15;
  if (repo.license) score += 10;
  if (repo.stargazers_count > 0) score += 10;
  if (repo.pushed_at) score += 10;
  if (Object.keys(languages || {}).length > 1) score += 10;
  if ((repo.topics || []).length > 0) score += 10;

  return Math.min(100, score);
};

const detectRepoType = (repo, languages = {}) => {
  const text = `${repo.name || ""} ${repo.description || ""} ${(repo.topics || []).join(
    " "
  )}`.toLowerCase();

  const languageKeys = Object.keys(languages || {}).map((lang) => lang.toLowerCase());

  return {
    isBackend:
      text.includes("api") ||
      text.includes("server") ||
      text.includes("backend") ||
      languageKeys.includes("javascript") ||
      languageKeys.includes("typescript") ||
      languageKeys.includes("python") ||
      languageKeys.includes("java"),
    isFrontend:
      text.includes("react") ||
      text.includes("frontend") ||
      text.includes("ui") ||
      languageKeys.includes("html") ||
      languageKeys.includes("css"),
    isAI:
      text.includes("ai") ||
      text.includes("ml") ||
      text.includes("llm") ||
      text.includes("rag") ||
      text.includes("openai") ||
      text.includes("groq") ||
      text.includes("model"),
    isFullstack:
      text.includes("mern") ||
      text.includes("fullstack") ||
      text.includes("full-stack") ||
      (languageKeys.includes("javascript") &&
        (languageKeys.includes("html") || languageKeys.includes("css"))),
  };
};

const fetchGitHub = async (userId, handle) => {
  try {
    if (!handle) {
      throw new Error("GitHub handle is required");
    }

    const username = handle.trim();

    const userRes = await axios.get(`https://api.github.com/users/${username}`, {
      timeout: 30000,
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    const reposRes = await axios.get(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
      {
        timeout: 30000,
        headers: {
          Accept: "application/vnd.github+json",
        },
      }
    );

    const repos = Array.isArray(reposRes.data) ? reposRes.data : [];

    const pinnedRepos = [];
    const languageWise = {};
    const contributionDates = [];

    const projectSignals = {
      backendRepos: 0,
      frontendRepos: 0,
      aiRepos: 0,
      fullstackRepos: 0,
      recentlyActiveRepos: 0,
      documentedRepos: 0,
      productionReadyRepos: 0,
    };

    const repoOps = [];

    for (const repo of repos) {
      const [languagesRes, commitsRes, readmeRes] = await Promise.allSettled([
        axios.get(repo.languages_url, {
          timeout: 30000,
          headers: { Accept: "application/vnd.github+json" },
        }),
        axios.get(`https://api.github.com/repos/${repo.full_name}/commits?per_page=5`, {
          timeout: 30000,
          headers: { Accept: "application/vnd.github+json" },
        }),
        axios.get(`https://api.github.com/repos/${repo.full_name}/readme`, {
          timeout: 30000,
          headers: { Accept: "application/vnd.github+json" },
        }),
      ]);

      const languages =
        languagesRes.status === "fulfilled" && languagesRes.value.data
          ? languagesRes.value.data
          : {};

      Object.entries(languages).forEach(([language, bytes]) => {
        languageWise[language] = (languageWise[language] || 0) + Number(bytes || 0);
      });

      const recentCommitObjects =
        commitsRes.status === "fulfilled" && Array.isArray(commitsRes.value.data)
          ? commitsRes.value.data
          : [];

      const recentCommits = recentCommitObjects
        .map((commit) => commit.commit?.message || "")
        .filter(Boolean);

      const readmeExists = readmeRes.status === "fulfilled";

      if (repo.pushed_at) {
        contributionDates.push(new Date(repo.pushed_at).toISOString().split("T")[0]);
      }

      const qualityScore = scoreRepoQuality(repo, languages, readmeExists);
      const type = detectRepoType(repo, languages);

      if (type.isBackend) projectSignals.backendRepos += 1;
      if (type.isFrontend) projectSignals.frontendRepos += 1;
      if (type.isAI) projectSignals.aiRepos += 1;
      if (type.isFullstack) projectSignals.fullstackRepos += 1;
      if (readmeExists) projectSignals.documentedRepos += 1;
      if (qualityScore >= 65) projectSignals.productionReadyRepos += 1;

      const pushedAt = repo.pushed_at ? new Date(repo.pushed_at) : null;

      if (pushedAt && Date.now() - pushedAt.getTime() <= 1000 * 60 * 60 * 24 * 60) {
        projectSignals.recentlyActiveRepos += 1;
      }

      const repoPayload = {
        name: repo.name || "",
        fullName: repo.full_name || "",
        description: repo.description || "",
        language: repo.language || "",
        topics: repo.topics || [],
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        watchers: repo.watchers_count || 0,
        openIssues: repo.open_issues_count || 0,
        size: repo.size || 0,
        url: repo.html_url || "",
        homepage: repo.homepage || "",
        createdAt: repo.created_at ? new Date(repo.created_at) : null,
        updatedAt: repo.updated_at ? new Date(repo.updated_at) : null,
        pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
        recentCommits,
        languages,
        quality: {
          hasReadme: readmeExists,
          hasPackageJson: false,
          hasTests: false,
          hasLicense: Boolean(repo.license),
          hasDeployment: Boolean(repo.homepage),
          qualityScore,
        },
      };

      pinnedRepos.push(repoPayload);

      repoOps.push({
        updateOne: {
          filter: {
            userId,
            fullName: repo.full_name,
          },
          update: {
            $set: {
              userId,
              githubHandle: username,
              repoId: repo.id || 0,
              name: repo.name || "",
              fullName: repo.full_name || "",
              description: repo.description || "",
              language: repo.language || "",
              languages,
              topics: repo.topics || [],
              stars: repo.stargazers_count || 0,
              forks: repo.forks_count || 0,
              watchers: repo.watchers_count || 0,
              openIssues: repo.open_issues_count || 0,
              size: repo.size || 0,
              defaultBranch: repo.default_branch || "main",
              url: repo.html_url || "",
              homepage: repo.homepage || "",
              cloneUrl: repo.clone_url || "",
              createdAtGithub: repo.created_at ? new Date(repo.created_at) : null,
              updatedAtGithub: repo.updated_at ? new Date(repo.updated_at) : null,
              pushedAtGithub: repo.pushed_at ? new Date(repo.pushed_at) : null,
              recentCommits: recentCommitObjects.map((commit) => ({
                message: commit.commit?.message || "",
                sha: commit.sha || "",
                url: commit.html_url || "",
                date: commit.commit?.author?.date ? new Date(commit.commit.author.date) : null,
                author: commit.commit?.author?.name || "",
              })),
              quality: {
                hasReadme: readmeExists,
                hasPackageJson: false,
                hasEnvExample: false,
                hasTests: false,
                hasLicense: Boolean(repo.license),
                hasDeployment: Boolean(repo.homepage),
                hasDocker: false,
                hasCI: false,
                qualityScore,
              },
              signals: {
                isFrontend: type.isFrontend,
                isBackend: type.isBackend,
                isFullstack: type.isFullstack,
                isAI: type.isAI,
                isSystems: false,
                isData: false,
              },
              rawData: repo,
              lastSyncedAt: new Date(),
            },
          },
          upsert: true,
        },
      });
    }

    if (repoOps.length > 0) {
      await GitHubRepo.bulkWrite(repoOps, { ordered: false });
    }

    return {
      handle: username,
      name: userRes.data.name || "",
      avatar: userRes.data.avatar_url || "",
      bio: userRes.data.bio || "",
      company: userRes.data.company || "",
      location: userRes.data.location || "",
      blog: userRes.data.blog || "",
      totalRepos: userRes.data.public_repos || 0,
      publicRepos: userRes.data.public_repos || 0,
      followers: userRes.data.followers || 0,
      following: userRes.data.following || 0,
      contributionDates: [...new Set(contributionDates)],
      activeDays: [...new Set(contributionDates)].length,
      pinnedRepos,
      languageWise,
      projectSignals,
      status: "Linked",
      error: "",
      lastSyncedAt: new Date(),
    };
  } catch (error) {
    console.error(`Error fetching GitHub stats for ${handle}:`, error.message);

    return {
      handle: handle || "",
      totalRepos: 0,
      publicRepos: 0,
      followers: 0,
      following: 0,
      contributionDates: [],
      activeDays: 0,
      pinnedRepos: [],
      languageWise: {},
      projectSignals: {
        backendRepos: 0,
        frontendRepos: 0,
        aiRepos: 0,
        fullstackRepos: 0,
        recentlyActiveRepos: 0,
        documentedRepos: 0,
        productionReadyRepos: 0,
      },
      status: "Error",
      error: error.message,
      lastSyncedAt: new Date(),
    };
  }
};

exports.syncLeetCode = async (req, res) => {
  try {
    const handle = await resolveHandle(req.user._id, "leetcode");

    if (!handle) {
      return res.status(400).json({
        message: "LeetCode handle missing. Please update your profile first.",
      });
    }

    const result = await syncPlatform({
      userId: req.user._id,
      platform: "leetcode",
      handle,
      fetcher: fetchLeetCode,
    });

    if (result.data?.status === "Error") {
      return res.status(502).json({
        message: "LeetCode sync failed",
        data: result.data,
      });
    }

    return res.status(200).json({
      message: "LeetCode synced successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("LeetCode Sync Error:", error.message);

    return res.status(500).json({
      message: "LeetCode sync failed",
      error: error.message,
    });
  }
};

exports.syncCodeforces = async (req, res) => {
  try {
    const handle = await resolveHandle(req.user._id, "codeforces");

    if (!handle) {
      return res.status(400).json({
        message: "Codeforces handle missing. Please update your profile first.",
      });
    }

    const result = await syncPlatform({
      userId: req.user._id,
      platform: "codeforces",
      handle,
      fetcher: fetchCodeforces,
    });

    if (result.data?.status === "Error") {
      return res.status(502).json({
        message: "Codeforces sync failed",
        data: result.data,
      });
    }

    return res.status(200).json({
      message: "Codeforces synced successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Codeforces Sync Error:", error.message);

    return res.status(500).json({
      message: "Codeforces sync failed",
      error: error.message,
    });
  }
};

exports.syncCodechef = async (req, res) => {
  try {
    const handle = await resolveHandle(req.user._id, "codechef");

    if (!handle) {
      return res.status(400).json({
        message: "CodeChef handle missing. Please update your profile first.",
      });
    }

    const result = await syncPlatform({
      userId: req.user._id,
      platform: "codechef",
      handle,
      fetcher: fetchCodechef,
    });

    if (result.data?.status === "Error") {
      return res.status(502).json({
        message: "CodeChef sync failed",
        data: result.data,
      });
    }

    return res.status(200).json({
      message: "CodeChef synced successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("CodeChef Sync Error:", error.message);

    return res.status(500).json({
      message: "CodeChef sync failed",
      error: error.message,
    });
  }
};

exports.syncGitHub = async (req, res) => {
  try {
    const handle = await resolveHandle(req.user._id, "github");

    if (!handle) {
      return res.status(400).json({
        message: "GitHub handle missing. Please update your profile first.",
      });
    }

    const result = await syncPlatform({
      userId: req.user._id,
      platform: "github",
      handle,
      fetcher: fetchGitHub,
    });

    if (result.data?.status === "Error") {
      return res.status(502).json({
        message: "GitHub sync failed",
        data: result.data,
      });
    }

    return res.status(200).json({
      message: "GitHub synced successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("GitHub Sync Error:", error.message);

    return res.status(500).json({
      message: "GitHub sync failed",
      error: error.message,
    });
  }
};

exports.syncAllPlatforms = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found. Please complete onboarding first.",
      });
    }

    const jobs = [];

    if (profile.leetcodeHandle) {
      jobs.push(
        syncPlatform({
          userId: req.user._id,
          platform: "leetcode",
          handle: profile.leetcodeHandle,
          fetcher: fetchLeetCode,
        })
      );
    }

    if (profile.codeforcesHandle) {
      jobs.push(
        syncPlatform({
          userId: req.user._id,
          platform: "codeforces",
          handle: profile.codeforcesHandle,
          fetcher: fetchCodeforces,
        })
      );
    }

    if (profile.codechefHandle) {
      jobs.push(
        syncPlatform({
          userId: req.user._id,
          platform: "codechef",
          handle: profile.codechefHandle,
          fetcher: fetchCodechef,
        })
      );
    }

    if (profile.githubHandle) {
      jobs.push(
        syncPlatform({
          userId: req.user._id,
          platform: "github",
          handle: profile.githubHandle,
          fetcher: fetchGitHub,
        })
      );
    }

    if (!jobs.length) {
      return res.status(400).json({
        message: "No platform handles found in profile.",
      });
    }

    const settled = await Promise.allSettled(jobs);

    const results = settled.map((item) => {
      if (item.status === "fulfilled") {
        return {
          platform: item.value.platform,
          success: item.value.data?.status !== "Error",
          data: item.value.data,
          error: item.value.data?.status === "Error" ? item.value.data?.error : "",
        };
      }

      return {
        success: false,
        error: item.reason?.message || "Unknown sync error",
      };
    });

    const latestProfile = await CodingProfile.findOne({ userId: req.user._id });

    return res.status(200).json({
      message: "Platform sync completed",
      results,
      codingProfile: latestProfile,
    });
  } catch (error) {
    console.error("Sync All Error:", error.message);

    return res.status(500).json({
      message: "Platform sync failed",
      error: error.message,
    });
  }
};

exports.getGitHubRepos = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });

    if (!profile?.githubHandle) {
      return res.status(404).json({
        message: "GitHub handle not linked",
      });
    }

    const response = await axios.get(
      `https://api.github.com/users/${profile.githubHandle.trim()}/repos?sort=updated&per_page=10`,
      {
        timeout: 30000,
        headers: {
          Accept: "application/vnd.github+json",
        },
      }
    );

    return res.status(200).json({
      data: response.data,
    });
  } catch (error) {
    console.error("GitHub Repo Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch GitHub repositories",
      error: error.message,
    });
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    const coding = await CodingProfile.findOne({ userId: req.user._id });

    if (!coding) {
      return res.status(200).json({
        totalSolved: 0,
        streak: 0,
        maxStreak: 0,
        irs: 0,
        platformOverview: [],
        analysis: {
          weakestTopics: [],
          strongestTopic: "None",
          fullCompetency: [],
        },
        platforms: {
          leetcode: {},
          codeforces: {},
          codechef: {},
          github: {},
        },
        combined: {
          totalSolved: 0,
          totalActiveDays: 0,
          strongestTopics: [],
          weakestTopics: [],
          readinessScore: 0,
          currentStreak: 0,
          maxStreak: 0,
        },
        message: "No coding stats synced yet",
      });
    }

    const totalSolved =
      Number(coding.leetcode?.totalSolved || 0) +
      Number(coding.codeforces?.totalSolved || 0) +
      Number(coding.codechef?.totalSolved || 0);

    const allDates = [
      ...(coding.leetcode?.dates || []),
      ...(coding.codeforces?.dates || []),
      ...(coding.codechef?.dates || []),
    ];

    const streakData = calculateStreakFromDates(allDates);
    const competencyData = analyzeCompetency(coding);

    const strongestTopic =
      competencyData.length > 0
        ? [...competencyData].sort((a, b) => b.score - a.score)[0].topic
        : "None";

    const combined =
      coding.combined && coding.combined.readinessScore !== undefined
        ? coding.combined
        : buildCombinedAnalytics(coding);

    const irs =
      combined?.readinessScore !== undefined
        ? combined.readinessScore
        : Math.round(
            Math.min(totalSolved / 600, 1) * 35 +
              Math.min(streakData.currentStreak / 30, 1) * 25 +
              Math.min(competencyData.length / 25, 1) * 25 +
              Math.min(
                Number(coding.github?.projectSignals?.productionReadyRepos || 0) / 3,
                1
              ) *
                15
          );

    const platformOverview = buildPlatformOverview(coding);

    return res.status(200).json({
      totalSolved,
      streak: Number(combined?.currentStreak || streakData.currentStreak || 0),
      maxStreak: Number(combined?.maxStreak || streakData.maxStreak || 0),
      irs,
      platformOverview,
      analysis: {
        weakestTopics: competencyData.slice(0, 6),
        strongestTopic,
        fullCompetency: competencyData,
      },
      combined: combined || {},
      platforms: {
        leetcode: {
          ...(coding.leetcode?.toObject ? coding.leetcode.toObject() : coding.leetcode || {}),
          streak: getPlatformCurrentStreak(coding.leetcode),
          maxStreak: getPlatformMaxStreak(coding.leetcode),
        },
        codeforces: {
          ...(coding.codeforces?.toObject
            ? coding.codeforces.toObject()
            : coding.codeforces || {}),
          streak: getPlatformCurrentStreak(coding.codeforces),
          maxStreak: getPlatformMaxStreak(coding.codeforces),
        },
        codechef: {
          ...(coding.codechef?.toObject ? coding.codechef.toObject() : coding.codechef || {}),
          streak: getPlatformCurrentStreak(coding.codechef),
          maxStreak: getPlatformMaxStreak(coding.codechef),
        },
        github: coding.github || {},
      },
    });
  } catch (error) {
    console.error("Dashboard Summary Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch dashboard summary",
      error: error.message,
    });
  }
};

exports.buildSolvedHistory = async (req, res) => {
  try {
    const solved = await SolvedProblem.find({ userId: req.user._id }).sort({
      date: 1,
    });

    return res.status(200).json({
      history: solved,
    });
  } catch (error) {
    console.error("Solved History Error:", error.message);

    return res.status(500).json({
      message: "Failed to build solved history",
      error: error.message,
    });
  }
};