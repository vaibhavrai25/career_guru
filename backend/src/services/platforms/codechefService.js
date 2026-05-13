const axios = require("axios");

const SolvedProblem = require("../../models/SolvedProblem");
const ContestHistory = require("../../models/ContestHistory");
const PlatformSubmission = require("../../models/PlatformSubmission");
const UpcomingContest = require("../../models/UpcomingContest");

const todayString = () => new Date().toISOString().split("T")[0];

const normalizeRatingHistory = (data) => {
  const raw =
    data.ratingData ||
    data.ratingHistory ||
    data.contestHistory ||
    data.contests ||
    [];

  if (!Array.isArray(raw)) return [];

  return raw.map((item) => {
    const rating = Number(item.rating || item.newRating || item.currentRating || 0);
    const oldRating = Number(item.oldRating || 0);
    const ratingDelta = oldRating ? rating - oldRating : 0;

    return {
      rating,
      oldRating,
      newRating: rating,
      ratingDelta,
      rank: item.rank ? String(item.rank) : "",
      contestRank: Number(item.rank || 0),
      contestName: item.name || item.contestName || item.code || "",
      contestId: item.code || item.contestCode || item.name || "",
      date: item.date ? new Date(item.date) : null,
    };
  });
};

const predictCodechefRating = (rating, ratingHistory = []) => {
  const currentRating = Number(rating || 0);

  if (!currentRating) {
    return {
      currentRating: 0,
      predictedNextRating: 0,
      expectedDelta: 0,
      bestCase: 0,
      worstCase: 0,
      confidence: 0,
      reason: "Rating unavailable.",
    };
  }

  const recent = ratingHistory.slice(-5);
  const deltas = recent.map((item) => Number(item.ratingDelta || 0));
  const avgDelta = deltas.length
    ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length
    : 0;

  const expectedDelta = Math.round(avgDelta * 0.6);

  return {
    currentRating,
    predictedNextRating: Math.max(0, currentRating + expectedDelta),
    expectedDelta,
    bestCase: Math.max(0, currentRating + expectedDelta + 35),
    worstCase: Math.max(0, currentRating + expectedDelta - 45),
    confidence: Math.min(75, 35 + recent.length * 8),
    reason: "Based on recent CodeChef rating movement. Limited by available public data.",
  };
};

const normalizeCodeChefContest = (contest) => {
  const code =
    contest.contest_code ||
    contest.code ||
    contest.contestCode ||
    contest.id ||
    "";
  const name =
    contest.contest_name ||
    contest.name ||
    contest.title ||
    code ||
    "CodeChef Contest";

  const startRaw =
    contest.contest_start_date_iso ||
    contest.start_date_iso ||
    contest.startDate ||
    contest.start_time ||
    contest.start;

  const endRaw =
    contest.contest_end_date_iso ||
    contest.end_date_iso ||
    contest.endDate ||
    contest.end_time ||
    contest.end;

  const startTime = startRaw ? new Date(startRaw) : null;
  const endTime = endRaw ? new Date(endRaw) : null;

  if (!startTime || Number.isNaN(startTime.getTime())) return null;

  return {
    contestId: String(code || name),
    title: name,
    platform: "codechef",
    startTime,
    durationSeconds:
      endTime && !Number.isNaN(endTime.getTime())
        ? Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000))
        : 0,
    url: code ? `https://www.codechef.com/${code}` : "https://www.codechef.com/contests",
    phase: "BEFORE",
    rawData: contest,
  };
};

const fetchCodeChefUpcomingContests = async () => {
  try {
    const res = await axios.get("https://www.codechef.com/api/list/contests/all", {
      timeout: 30000,
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const rawFuture =
      res.data?.future_contests ||
      res.data?.futureContests ||
      res.data?.future ||
      [];

    if (!Array.isArray(rawFuture)) return [];

    return rawFuture
      .map(normalizeCodeChefContest)
      .filter(Boolean)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, 20);
  } catch (error) {
    console.warn("CodeChef upcoming contest fetch failed:", error.message);
    return [];
  }
};

const saveCodeChefUpcomingContests = async (contests) => {
  if (!Array.isArray(contests) || contests.length === 0) return;

  const operations = contests.map((contest) => ({
    updateOne: {
      filter: {
        platform: "codechef",
        contestId: contest.contestId || contest.title,
      },
      update: {
        $set: {
          platform: "codechef",
          contestId: contest.contestId || contest.title,
          title: contest.title,
          url: contest.url || "https://www.codechef.com/contests",
          startTime: contest.startTime,
          endTime:
            contest.startTime && contest.durationSeconds
              ? new Date(
                  new Date(contest.startTime).getTime() +
                    Number(contest.durationSeconds || 0) * 1000
                )
              : null,
          durationSeconds: Number(contest.durationSeconds || 0),
          phase: contest.phase || "BEFORE",
          type: "CodeChef Contest",
          difficultyHint: "",
          isActive: true,
          rawData: contest.rawData || contest,
        },
      },
      upsert: true,
    },
  }));

  await UpcomingContest.bulkWrite(operations, { ordered: false });
};

exports.fetchCodechef = async (userId, handle) => {
  try {
    if (!handle) {
      throw new Error("CodeChef handle is required");
    }

    const username = handle.trim();

    let res;

    try {
      res = await axios.get(`https://codechef-api.vercel.app/${username}`, {
        timeout: 30000,
      });
    } catch (firstError) {
      res = await axios.get(`https://codechef-api-five.vercel.app/${username}`, {
        timeout: 30000,
      });
    }

    if (!res.data || res.data.status === "Failed" || res.data.success === false) {
      throw new Error("CodeChef handle not found");
    }

    const data = res.data;
    const today = todayString();

    const totalSolved = Number(
      data.problemsSolved ||
        data.totalSolved ||
        data.fullySolvedCount ||
        data.fullySolved ||
        0
    );

    const partiallySolved = Number(
      data.partiallySolvedCount || data.partiallySolved || 0
    );

    const rating = Number(data.currentRating || data.rating || 0);
    const maxRating = Number(data.highestRating || data.maxRating || rating || 0);

    const ratingHistory = normalizeRatingHistory(data);
    const upcomingContests = await fetchCodeChefUpcomingContests();
    await saveCodeChefUpcomingContests(upcomingContests);

    const topicWise = {
      "competitive programming": totalSolved,
    };

    const difficultyWise = {
      Practice: totalSolved,
      Partial: partiallySolved,
    };

    await SolvedProblem.findOneAndUpdate(
      {
        userId,
        platform: "codechef",
        problemName: "CodeChef Summary Snapshot",
        date: today,
      },
      {
        $set: {
          userId,
          platform: "codechef",
          problemName: "CodeChef Summary Snapshot",
          problemSlug: "summary",
          problemUrl: `https://www.codechef.com/users/${username}`,
          topic: "competitive programming",
          tags: ["competitive programming"],
          difficulty: rating ? String(rating) : "summary",
          difficultyRating: rating || 0,
          date: today,
          submittedAt: new Date(),
          verdict: "SNAPSHOT",
          rawData: data,
        },
      },
      { upsert: true, new: true }
    );

    await PlatformSubmission.findOneAndUpdate(
      {
        userId,
        platform: "codechef",
        submissionId: `codechef-summary-${today}`,
      },
      {
        $set: {
          userId,
          platform: "codechef",
          submissionId: `codechef-summary-${today}`,
          problemName: "CodeChef Summary Snapshot",
          problemSlug: "summary",
          problemUrl: `https://www.codechef.com/users/${username}`,
          contestId: "",
          contestName: "",
          index: "",
          verdict: "SNAPSHOT",
          language: "",
          runtime: 0,
          memory: 0,
          difficulty: rating ? String(rating) : "summary",
          difficultyRating: rating || 0,
          topic: "competitive programming",
          tags: ["competitive programming"],
          submittedAt: new Date(),
          date: today,
          isAccepted: true,
          isCalendarOnly: false,
          source: "codechef-summary",
          rawData: data,
        },
      },
      { upsert: true, new: true }
    );

    if (ratingHistory.length > 0) {
      const contestOps = ratingHistory.map((contest) => ({
        updateOne: {
          filter: {
            userId,
            platform: "codechef",
            contestId: contest.contestId || contest.contestName,
          },
          update: {
            $set: {
              userId,
              platform: "codechef",
              contestId: contest.contestId || contest.contestName,
              contestName: contest.contestName || "CodeChef Contest",
              contestUrl: contest.contestId
                ? `https://www.codechef.com/${contest.contestId}`
                : "https://www.codechef.com/contests",
              rank: Number(contest.contestRank || 0),
              percentile: 0,
              totalParticipants: 0,
              oldRating: Number(contest.oldRating || 0),
              newRating: Number(contest.newRating || 0),
              rating: Number(contest.rating || 0),
              ratingDelta: Number(contest.ratingDelta || 0),
              problemsSolved: 0,
              totalProblems: 0,
              finishTimeSeconds: 0,
              contestDate: contest.date || null,
              problems: [],
              rawData: contest,
            },
          },
          upsert: true,
        },
      }));

      await ContestHistory.bulkWrite(contestOps, { ordered: false });
    }

    return {
      handle: username,
      totalSolved,
      easy: 0,
      medium: totalSolved,
      hard: 0,
      topicWise,
      dates: totalSolved > 0 ? [today] : [],
      streak: totalSolved > 0 ? 1 : 0,
      maxStreak: totalSolved > 0 ? 1 : 0,
      activeDays: totalSolved > 0 ? 1 : 0,
      rating,
      maxRating,
      rank: data.stars || data.globalRank || "",
      globalRank: Number(data.globalRank || 0),
      countryRank: Number(data.countryRank || 0),
      ratingHistory,
      upcomingContests,
      ratingPrediction: predictCodechefRating(rating, ratingHistory),
      submissionsSummary: {
        totalSubmissions: totalSolved + partiallySolved,
        acceptedSubmissions: totalSolved,
        acceptanceRate:
          totalSolved + partiallySolved
            ? Number(((totalSolved / (totalSolved + partiallySolved)) * 100).toFixed(2))
            : 0,
        activeDays: totalSolved > 0 ? 1 : 0,
        maxStreak: totalSolved > 0 ? 1 : 0,
        currentStreak: totalSolved > 0 ? 1 : 0,
        lastActiveDate: totalSolved > 0 ? today : "",
        verdictWise: {
          FullySolved: totalSolved,
          PartiallySolved: partiallySolved,
        },
        languageWise: {},
        difficultyWise,
        monthlyActivity: {
          [today.slice(0, 7)]: totalSolved,
        },
        yearlyActivity: {
          [today.slice(0, 4)]: totalSolved,
        },
        limitedData: true,
        note: "CodeChef public wrappers do not reliably expose complete submission history. Showing summary snapshot.",
      },
      profileMeta: {
        avatar: data.profile || data.profileImage || "",
        country: data.countryName || data.country || "",
        organization: data.institution || "",
        globalRanking: Number(data.globalRank || 0),
      },
      status: "Linked",
      error: "",
      lastSyncedAt: new Date(),
    };
  } catch (error) {
    console.error(`Error fetching CodeChef stats for ${handle}:`, error.message);

    return {
      handle: handle || "",
      totalSolved: 0,
      easy: 0,
      medium: 0,
      hard: 0,
      topicWise: {},
      dates: [],
      streak: 0,
      maxStreak: 0,
      activeDays: 0,
      rating: 0,
      maxRating: 0,
      rank: "",
      globalRank: 0,
      countryRank: 0,
      ratingHistory: [],
      upcomingContests: [],
      ratingPrediction: {
        currentRating: 0,
        predictedNextRating: 0,
        expectedDelta: 0,
        bestCase: 0,
        worstCase: 0,
        confidence: 0,
        reason: "CodeChef sync failed or API unavailable.",
      },
      submissionsSummary: {
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        acceptanceRate: 0,
        activeDays: 0,
        maxStreak: 0,
        currentStreak: 0,
        lastActiveDate: "",
        verdictWise: {},
        languageWise: {},
        difficultyWise: {},
        monthlyActivity: {},
        yearlyActivity: {},
        limitedData: true,
        note: "CodeChef sync failed or API unavailable.",
      },
      profileMeta: {},
      status: "Error",
      error: error.message,
      lastSyncedAt: new Date(),
    };
  }
};