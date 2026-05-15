const axios = require("axios");

const SolvedProblem = require("../../models/SolvedProblem");
const PlatformSubmission = require("../../models/PlatformSubmission");
const ContestHistory = require("../../models/ContestHistory");
const UpcomingContest = require("../../models/UpcomingContest");

const normalizeDate = (timestampSeconds) => {
  return new Date(timestampSeconds * 1000).toISOString().split("T")[0];
};

const todayString = () => new Date().toISOString().split("T")[0];

const timestampToDateObj = (timestampSeconds) => {
  if (!timestampSeconds) return null;
  return new Date(timestampSeconds * 1000);
};

const ratingToDifficultyBucket = (rating) => {
  if (!rating) return "Unknown";
  if (rating <= 1000) return "Easy";
  if (rating <= 1700) return "Medium";
  return "Hard";
};

const calculateStreaks = (dates) => {
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

  const today = todayString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

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

const buildActivityMaps = (dates) => {
  const monthlyActivity = {};
  const yearlyActivity = {};

  dates.forEach((date) => {
    if (!date) return;

    const monthKey = date.slice(0, 7);
    const yearKey = date.slice(0, 4);

    monthlyActivity[monthKey] = (monthlyActivity[monthKey] || 0) + 1;
    yearlyActivity[yearKey] = (yearlyActivity[yearKey] || 0) + 1;
  });

  return {
    monthlyActivity,
    yearlyActivity,
  };
};

const predictCodeforcesRating = (rating, ratingHistory = [], activeDays = 0) => {
  const currentRating = Number(rating || 0);

  if (!currentRating) {
    return {
      currentRating: 0,
      predictedNextRating: 0,
      expectedDelta: 0,
      bestCase: 0,
      worstCase: 0,
      confidence: 0,
      reason: "Rating unavailable or user is unrated.",
    };
  }

  const recent = ratingHistory.slice(-5);
  const deltas = recent.map((item) => Number(item.ratingDelta || 0));

  const avgDelta = deltas.length
    ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length
    : 0;

  const volatility = deltas.length
    ? deltas.reduce((sum, value) => sum + Math.abs(value - avgDelta), 0) /
      deltas.length
    : 50;

  const consistencyBoost = Math.min(activeDays / 30, 1) * 20;
  const expectedDelta = Math.round(avgDelta * 0.65 + consistencyBoost);

  return {
    currentRating,
    predictedNextRating: Math.max(0, currentRating + expectedDelta),
    expectedDelta,
    bestCase: Math.max(0, currentRating + expectedDelta + Math.round(volatility)),
    worstCase: Math.max(0, currentRating + expectedDelta - Math.round(volatility)),
    confidence: Math.min(90, 35 + recent.length * 10 + Math.min(activeDays, 30)),
    reason: "Based on recent rating delta, volatility, and practice consistency.",
  };
};

const saveCodeforcesUpcomingContests = async (upcomingContests) => {
  if (!Array.isArray(upcomingContests) || upcomingContests.length === 0) return;

  const operations = upcomingContests
    .filter((contest) => contest.title && contest.startTime)
    .map((contest) => ({
      updateOne: {
        filter: {
          platform: "codeforces",
          contestId: contest.contestId || contest.title,
        },
        update: {
          $set: {
            platform: "codeforces",
            contestId: contest.contestId || contest.title,
            title: contest.title,
            url: contest.url || "",
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
            type: "Codeforces Contest",
            difficultyHint: "",
            isFallback: false,
            isActive: true,
            rawData: contest.rawData || contest,
          },
        },
        upsert: true,
      },
    }));

  if (operations.length > 0) {
    await UpcomingContest.bulkWrite(operations, { ordered: false });
  }
};

exports.fetchCodeforces = async (userId, handle) => {
  try {
    if (!handle) {
      throw new Error("Codeforces handle is required");
    }

    const username = handle.trim();

    const [infoRes, statusRes, ratingRes, contestRes] = await Promise.allSettled([
      axios.get(`https://codeforces.com/api/user.info?handles=${username}`, {
        timeout: 30000,
      }),
      axios.get(`https://codeforces.com/api/user.status?handle=${username}`, {
        timeout: 30000,
      }),
      axios.get(`https://codeforces.com/api/user.rating?handle=${username}`, {
        timeout: 30000,
      }),
      axios.get("https://codeforces.com/api/contest.list?gym=false", {
        timeout: 30000,
      }),
    ]);

    if (
      infoRes.status !== "fulfilled" ||
      infoRes.value.data.status !== "OK" ||
      !infoRes.value.data.result?.[0]
    ) {
      throw new Error("Codeforces handle not found");
    }

    const userInfo = infoRes.value.data.result[0];

    const submissions =
      statusRes.status === "fulfilled" && statusRes.value.data.status === "OK"
        ? statusRes.value.data.result
        : [];

    const ratingHistoryRaw =
      ratingRes.status === "fulfilled" && ratingRes.value.data.status === "OK"
        ? ratingRes.value.data.result
        : [];

    const contestsRaw =
      contestRes.status === "fulfilled" && contestRes.value.data.status === "OK"
        ? contestRes.value.data.result
        : [];

    const solvedMap = new Map();
    const allDates = [];
    const acceptedDates = [];
    const verdictWise = {};
    const languageWise = {};
    const difficultyWise = {};
    const topicWise = {};

    const platformSubmissionOps = submissions.map((sub) => {
      const problem = sub.problem || {};
      const tags = Array.isArray(problem.tags)
        ? problem.tags.map((tag) => String(tag).toLowerCase().trim())
        : [];

      const rating = Number(problem.rating || 0);
      const difficulty = ratingToDifficultyBucket(rating);
      const date = sub.creationTimeSeconds
        ? normalizeDate(sub.creationTimeSeconds)
        : todayString();

      const isAccepted = sub.verdict === "OK";
      const verdict = sub.verdict || "UNKNOWN";

      verdictWise[verdict] = (verdictWise[verdict] || 0) + 1;

      if (sub.programmingLanguage) {
        languageWise[sub.programmingLanguage] =
          (languageWise[sub.programmingLanguage] || 0) + 1;
      }

      if (sub.creationTimeSeconds) {
        allDates.push(date);
      }

      if (isAccepted && sub.problem) {
        const contestId = problem.contestId || "unknown";
        const index = problem.index || "";
        const key = `${contestId}-${index}-${problem.name}`;

        if (!solvedMap.has(key)) {
          solvedMap.set(key, sub);
        }
      }

      return {
        updateOne: {
          filter: {
            userId,
            platform: "codeforces",
            submissionId: String(sub.id || `${problem.name}-${sub.creationTimeSeconds}`),
          },
          update: {
            $set: {
              userId,
              platform: "codeforces",
              submissionId: String(sub.id || `${problem.name}-${sub.creationTimeSeconds}`),
              problemName: problem.name || "Unknown Problem",
              problemSlug: `${problem.contestId || ""}${problem.index || ""}`,
              problemUrl:
                problem.contestId && problem.index
                  ? `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`
                  : "",
              contestId: problem.contestId ? String(problem.contestId) : "",
              contestName: "",
              index: problem.index || "",
              verdict,
              language: sub.programmingLanguage || "",
              runtime: Number(sub.timeConsumedMillis || 0),
              memory: Number(sub.memoryConsumedBytes || 0),
              difficulty,
              difficultyRating: rating,
              topic: tags[0] || "general",
              tags,
              submittedAt: sub.creationTimeSeconds
                ? timestampToDateObj(sub.creationTimeSeconds)
                : null,
              date,
              isAccepted,
              isCalendarOnly: false,
              source: "codeforces-user-status",
              rawData: sub,
            },
          },
          upsert: true,
        },
      };
    });

    if (platformSubmissionOps.length > 0) {
      await PlatformSubmission.bulkWrite(platformSubmissionOps, { ordered: false });
    }

    const solvedSubs = Array.from(solvedMap.values());

    let easy = 0;
    let medium = 0;
    let hard = 0;

    const solvedProblemOps = solvedSubs.map((sub) => {
      const tags = sub.problem.tags || [];
      const normalizedTags = tags.map((tag) => String(tag).toLowerCase().trim());
      const primaryTopic = normalizedTags[0] || "general";
      const date = normalizeDate(sub.creationTimeSeconds);
      const rating = Number(sub.problem.rating || 0);
      const difficulty = ratingToDifficultyBucket(rating);

      normalizedTags.forEach((tag) => {
        topicWise[tag] = (topicWise[tag] || 0) + 1;
      });

      difficultyWise[difficulty] = (difficultyWise[difficulty] || 0) + 1;
      acceptedDates.push(date);

      if (difficulty === "Easy") easy += 1;
      else if (difficulty === "Medium") medium += 1;
      else if (difficulty === "Hard") hard += 1;

      return {
        updateOne: {
          filter: {
            userId,
            platform: "codeforces",
            problemName: sub.problem.name,
          },
          update: {
            $set: {
              userId,
              platform: "codeforces",
              problemName: sub.problem.name,
              problemSlug: `${sub.problem.contestId || ""}${sub.problem.index || ""}`,
              problemUrl:
                sub.problem.contestId && sub.problem.index
                  ? `https://codeforces.com/problemset/problem/${sub.problem.contestId}/${sub.problem.index}`
                  : "",
              topic: primaryTopic,
              tags: normalizedTags,
              difficulty,
              difficultyRating: rating,
              contestId: sub.problem.contestId ? String(sub.problem.contestId) : "",
              contestName: "",
              language: sub.programmingLanguage || "",
              verdict: sub.verdict || "",
              date,
              submittedAt: timestampToDateObj(sub.creationTimeSeconds),
              runtime: Number(sub.timeConsumedMillis || 0),
              memory: Number(sub.memoryConsumedBytes || 0),
              rawData: sub,
            },
          },
          upsert: true,
        },
      };
    });

    if (solvedProblemOps.length > 0) {
      await SolvedProblem.bulkWrite(solvedProblemOps, { ordered: false });
    }

    const dates = [...new Set(acceptedDates)];
    const streakData = calculateStreaks(dates);
    const activityMaps = buildActivityMaps(allDates);

    const ratingHistory = ratingHistoryRaw.map((item) => ({
      rating: item.newRating || 0,
      oldRating: item.oldRating || 0,
      newRating: item.newRating || 0,
      ratingDelta: Number(item.newRating || 0) - Number(item.oldRating || 0),
      rank: item.rank ? String(item.rank) : "",
      contestRank: Number(item.rank || 0),
      contestName: item.contestName || "",
      contestId: item.contestId ? String(item.contestId) : "",
      date: item.ratingUpdateTimeSeconds
        ? timestampToDateObj(item.ratingUpdateTimeSeconds)
        : null,
    }));

    if (ratingHistory.length > 0) {
      const contestHistoryOps = ratingHistory.map((contest) => ({
        updateOne: {
          filter: {
            userId,
            platform: "codeforces",
            contestId: contest.contestId || contest.contestName,
          },
          update: {
            $set: {
              userId,
              platform: "codeforces",
              contestId: contest.contestId || contest.contestName,
              contestName: contest.contestName || "Codeforces Contest",
              contestUrl: contest.contestId
                ? `https://codeforces.com/contest/${contest.contestId}`
                : "",
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

      await ContestHistory.bulkWrite(contestHistoryOps, { ordered: false });
    }

    const upcomingContests = contestsRaw
      .filter((contest) => contest.phase === "BEFORE")
      .slice(0, 20)
      .map((contest) => ({
        contestId: contest.id ? String(contest.id) : "",
        title: contest.name || "",
        platform: "codeforces",
        startTime: contest.startTimeSeconds
          ? timestampToDateObj(contest.startTimeSeconds)
          : null,
        durationSeconds: Number(contest.durationSeconds || 0),
        url: contest.id ? `https://codeforces.com/contest/${contest.id}` : "",
        phase: contest.phase || "BEFORE",
        rawData: contest,
      }));

    await saveCodeforcesUpcomingContests(upcomingContests);

    const acceptedSubmissions = solvedSubs.length;
    const totalSubmissions = submissions.length;
    const acceptanceRate = totalSubmissions
      ? Number(((acceptedSubmissions / totalSubmissions) * 100).toFixed(2))
      : 0;

    const currentRating = Number(userInfo.rating || 0);
    const maxRating = Number(userInfo.maxRating || currentRating || 0);

    return {
      handle: username,
      totalSolved: solvedSubs.length,
      easy,
      medium,
      hard,
      topicWise,
      dates,
      streak: streakData.currentStreak,
      maxStreak: streakData.maxStreak,
      activeDays: streakData.activeDays,
      rating: currentRating,
      maxRating,
      rank: userInfo.rank || "unrated",
      globalRank: 0,
      ratingHistory,
      upcomingContests,
      ratingPrediction: predictCodeforcesRating(
        currentRating,
        ratingHistory,
        streakData.activeDays
      ),
      submissionsSummary: {
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate,
        activeDays: streakData.activeDays,
        maxStreak: streakData.maxStreak,
        currentStreak: streakData.currentStreak,
        lastActiveDate: streakData.lastActiveDate,
        verdictWise,
        languageWise,
        difficultyWise,
        monthlyActivity: activityMaps.monthlyActivity,
        yearlyActivity: activityMaps.yearlyActivity,
        limitedData: false,
        note: "",
      },
      profileMeta: {
        avatar: userInfo.avatar || "",
        realName: "",
        country: userInfo.country || "",
        organization: userInfo.organization || "",
        contribution: Number(userInfo.contribution || 0),
        followers: Number(userInfo.friendOfCount || 0),
        registrationTime: userInfo.registrationTimeSeconds
          ? timestampToDateObj(userInfo.registrationTimeSeconds)
          : null,
        lastOnlineTime: userInfo.lastOnlineTimeSeconds
          ? timestampToDateObj(userInfo.lastOnlineTimeSeconds)
          : null,
      },
      status: "Linked",
      error: "",
      lastSyncedAt: new Date(),
    };
  } catch (error) {
    console.error(`Error fetching Codeforces stats for ${handle}:`, error.message);

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
      ratingHistory: [],
      upcomingContests: [],
      ratingPrediction: {
        currentRating: 0,
        predictedNextRating: 0,
        expectedDelta: 0,
        bestCase: 0,
        worstCase: 0,
        confidence: 0,
        reason: "Codeforces sync failed.",
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
        limitedData: false,
        note: "Codeforces sync failed.",
      },
      profileMeta: {},
      status: "Error",
      error: error.message,
      lastSyncedAt: new Date(),
    };
  }
};