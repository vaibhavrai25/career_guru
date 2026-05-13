const PlatformSubmission = require("../models/PlatformSubmission");
const ContestHistory = require("../models/ContestHistory");
const UpcomingContest = require("../models/UpcomingContest");
const GitHubRepo = require("../models/GitHubRepo");
const UserAnalyticsSnapshot = require("../models/UserAnalyticsSnapshot");
const CodingProfile = require("../models/CodingProfile");

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildDateFilter = ({ from, to, field = "date" }) => {
  const filter = {};

  if (from || to) {
    filter[field] = {};

    if (from) {
      filter[field].$gte = from;
    }

    if (to) {
      filter[field].$lte = to;
    }
  }

  return filter;
};

const normalizePlatform = (platform) => {
  return platform ? String(platform).toLowerCase().trim() : "";
};

const buildFallbackSubmissionsFromProfileDates = (codingProfile, platform) => {
  if (!codingProfile || !platform) return [];

  const platformData = codingProfile[platform];

  if (!platformData || !Array.isArray(platformData.dates)) return [];

  return [...new Set(platformData.dates)]
    .filter(Boolean)
    .map((date) => ({
      _id: `fallback-${platform}-${date}`,
      userId: codingProfile.userId,
      platform,
      submissionId: `fallback-${platform}-${date}`,
      problemName:
        platform === "leetcode"
          ? "LeetCode Calendar Activity"
          : platform === "codechef"
          ? "CodeChef Summary Activity"
          : "Platform Activity",
      problemSlug: "calendar-activity",
      problemUrl:
        platform === "leetcode"
          ? `https://leetcode.com/${platformData.handle || ""}/`
          : platform === "codechef"
          ? `https://www.codechef.com/users/${platformData.handle || ""}`
          : "",
      contestId: "",
      contestName: "",
      index: "",
      verdict: "CALENDAR",
      language: "",
      runtime: 0,
      memory: 0,
      difficulty: "calendar",
      difficultyRating: 0,
      topic: "activity",
      tags: ["activity"],
      submittedAt: new Date(date),
      date,
      isAccepted: true,
      isCalendarOnly: true,
      source: "codingProfile.dates",
      rawData: {
        fallback: true,
      },
    }));
};

exports.getSubmissions = async (req, res) => {
  try {
    const {
      platform,
      verdict,
      topic,
      difficulty,
      isAccepted,
      from,
      to,
      page = 1,
      limit = 100,
      sort = "desc",
      includeFallback = "true",
    } = req.query;

    const pageNumber = toNumber(page, 1);
    const limitNumber = Math.min(toNumber(limit, 100), 1000);
    const skip = (pageNumber - 1) * limitNumber;

    const normalizedPlatform = normalizePlatform(platform);

    const query = {
      userId: req.user._id,
      ...buildDateFilter({ from, to, field: "date" }),
    };

    if (normalizedPlatform) query.platform = normalizedPlatform;
    if (verdict) query.verdict = verdict;
    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;

    if (isAccepted === "true") query.isAccepted = true;
    if (isAccepted === "false") query.isAccepted = false;

    const [items, total] = await Promise.all([
      PlatformSubmission.find(query)
        .sort({ submittedAt: sort === "asc" ? 1 : -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      PlatformSubmission.countDocuments(query),
    ]);

    let data = items;
    let finalTotal = total;
    let usedFallback = false;

    if (
      includeFallback === "true" &&
      normalizedPlatform &&
      data.length === 0 &&
      (normalizedPlatform === "leetcode" || normalizedPlatform === "codechef")
    ) {
      const codingProfile = await CodingProfile.findOne({ userId: req.user._id }).lean();

      let fallbackData = buildFallbackSubmissionsFromProfileDates(
        codingProfile,
        normalizedPlatform
      );

      if (from) fallbackData = fallbackData.filter((item) => item.date >= from);
      if (to) fallbackData = fallbackData.filter((item) => item.date <= to);

      if (isAccepted === "false") fallbackData = [];

      data = sort === "asc" ? fallbackData : fallbackData.reverse();
      finalTotal = data.length;
      usedFallback = data.length > 0;
    }

    return res.status(200).json({
      page: pageNumber,
      limit: limitNumber,
      total: finalTotal,
      totalPages: Math.ceil(finalTotal / limitNumber),
      usedFallback,
      data,
    });
  } catch (error) {
    console.error("Get Submissions Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch submissions",
      error: error.message,
    });
  }
};

exports.getContestHistory = async (req, res) => {
  try {
    const {
      platform,
      from,
      to,
      page = 1,
      limit = 100,
      sort = "desc",
    } = req.query;

    const pageNumber = toNumber(page, 1);
    const limitNumber = Math.min(toNumber(limit, 100), 500);
    const skip = (pageNumber - 1) * limitNumber;

    const query = {
      userId: req.user._id,
    };

    if (platform) query.platform = normalizePlatform(platform);

    if (from || to) {
      query.contestDate = {};
      if (from) query.contestDate.$gte = new Date(from);
      if (to) query.contestDate.$lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      ContestHistory.find(query)
        .sort({ contestDate: sort === "asc" ? 1 : -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      ContestHistory.countDocuments(query),
    ]);

    return res.status(200).json({
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
      data: items,
    });
  } catch (error) {
    console.error("Get Contest History Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch contest history",
      error: error.message,
    });
  }
};

exports.getUpcomingContests = async (req, res) => {
  try {
    const { platform, limit = 50, includeFallback = "true" } = req.query;

    const limitNumber = Math.min(toNumber(limit, 50), 200);

    const query = {
      isActive: true,
      startTime: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    };

    if (platform) query.platform = normalizePlatform(platform);

    let contests = await UpcomingContest.find(query)
      .sort({ startTime: 1 })
      .limit(limitNumber)
      .lean();

    if (includeFallback === "true" && platform && contests.length === 0) {
      const normalizedPlatform = normalizePlatform(platform);
      const codingProfile = await CodingProfile.findOne({ userId: req.user._id }).lean();

      const platformContests =
        codingProfile?.[normalizedPlatform]?.upcomingContests || [];

      contests = platformContests
        .filter((contest) => contest.startTime)
        .map((contest, index) => ({
          _id: `fallback-contest-${normalizedPlatform}-${index}`,
          platform: normalizedPlatform,
          contestId: contest.contestId || contest.title || "",
          title: contest.title || `${normalizedPlatform} Contest`,
          url: contest.url || "",
          startTime: contest.startTime,
          endTime:
            contest.startTime && contest.durationSeconds
              ? new Date(
                  new Date(contest.startTime).getTime() +
                    Number(contest.durationSeconds || 0) * 1000
                )
              : null,
          durationSeconds: contest.durationSeconds || 0,
          phase: contest.phase || "BEFORE",
          type: `${normalizedPlatform} contest`,
          difficultyHint: "",
          isFallback: true,
          isActive: true,
          rawData: contest,
        }));
    }

    return res.status(200).json({
      total: contests.length,
      data: contests,
    });
  } catch (error) {
    console.error("Get Upcoming Contests Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch upcoming contests",
      error: error.message,
    });
  }
};

exports.getDeepGitHubRepos = async (req, res) => {
  try {
    const {
      language,
      signal,
      minQuality,
      sort = "updated",
      page = 1,
      limit = 50,
    } = req.query;

    const pageNumber = toNumber(page, 1);
    const limitNumber = Math.min(toNumber(limit, 50), 200);
    const skip = (pageNumber - 1) * limitNumber;

    const query = {
      userId: req.user._id,
    };

    if (language) {
      query.language = new RegExp(`^${language}$`, "i");
    }

    if (minQuality) {
      query["quality.qualityScore"] = {
        $gte: Number(minQuality),
      };
    }

    if (signal) {
      const signalMap = {
        frontend: "signals.isFrontend",
        backend: "signals.isBackend",
        fullstack: "signals.isFullstack",
        ai: "signals.isAI",
        systems: "signals.isSystems",
        data: "signals.isData",
      };

      if (signalMap[signal]) {
        query[signalMap[signal]] = true;
      }
    }

    const sortMap = {
      updated: { pushedAtGithub: -1, updatedAtGithub: -1 },
      stars: { stars: -1 },
      forks: { forks: -1 },
      quality: { "quality.qualityScore": -1 },
      size: { size: -1 },
      name: { name: 1 },
    };

    const sortQuery = sortMap[sort] || sortMap.updated;

    const [items, total] = await Promise.all([
      GitHubRepo.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      GitHubRepo.countDocuments(query),
    ]);

    return res.status(200).json({
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
      data: items,
    });
  } catch (error) {
    console.error("Get GitHub Deep Repos Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch GitHub repository analytics",
      error: error.message,
    });
  }
};

exports.getAnalyticsSnapshots = async (req, res) => {
  try {
    const {
      from,
      to,
      page = 1,
      limit = 100,
      sort = "asc",
    } = req.query;

    const pageNumber = toNumber(page, 1);
    const limitNumber = Math.min(toNumber(limit, 100), 500);
    const skip = (pageNumber - 1) * limitNumber;

    const query = {
      userId: req.user._id,
      ...buildDateFilter({ from, to, field: "date" }),
    };

    const [items, total] = await Promise.all([
      UserAnalyticsSnapshot.find(query)
        .sort({ date: sort === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      UserAnalyticsSnapshot.countDocuments(query),
    ]);

    return res.status(200).json({
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
      data: items,
    });
  } catch (error) {
    console.error("Get Analytics Snapshots Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch analytics snapshots",
      error: error.message,
    });
  }
};