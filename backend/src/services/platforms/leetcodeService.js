const axios = require("axios");

const SolvedProblem = require("../../models/SolvedProblem");
const PlatformSubmission = require("../../models/PlatformSubmission");
const ContestHistory = require("../../models/ContestHistory");
const UpcomingContest = require("../../models/UpcomingContest");

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

const todayString = () => new Date().toISOString().split("T")[0];

const timestampToDate = (timestamp) => {
  if (!timestamp) return todayString();
  return new Date(Number(timestamp) * 1000).toISOString().split("T")[0];
};

const timestampToDateObj = (timestamp) => {
  if (!timestamp) return null;
  return new Date(Number(timestamp) * 1000);
};

const normalizeTopic = (topic) => {
  return String(topic || "general").toLowerCase().trim();
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

const safeJsonParse = (value, fallback = {}) => {
  try {
    if (!value) return fallback;
    if (typeof value === "object") return value;
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const runLeetCodeQuery = async (query, variables = {}) => {
  const response = await axios.post(
    LEETCODE_GRAPHQL_URL,
    {
      query,
      variables,
    },
    {
      timeout: 20000,
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
        Origin: "https://leetcode.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      },
    }
  );

  if (response.data?.errors?.length) {
    throw new Error(response.data.errors[0]?.message || "LeetCode GraphQL error");
  }

  return response.data?.data || {};
};

const fetchProblemDetails = async (titleSlug) => {
  if (!titleSlug) return null;

  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionFrontendId
        title
        titleSlug
        difficulty
        topicTags {
          name
          slug
        }
      }
    }
  `;

  try {
    const data = await runLeetCodeQuery(query, { titleSlug });
    return data?.question || null;
  } catch (error) {
    return null;
  }
};

const predictLeetCodeRating = (rating, history = [], activeDays = 0) => {
  const currentRating = Number(rating || 0);

  if (!currentRating) {
    return {
      currentRating: 0,
      predictedNextRating: 0,
      expectedDelta: 0,
      bestCase: 0,
      worstCase: 0,
      confidence: 0,
      reason: "Contest rating not available.",
    };
  }

  const recent = history.slice(-5);
  const deltas = recent.map((item) => Number(item.ratingDelta || 0));

  const avgDelta = deltas.length
    ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length
    : 0;

  const consistencyBoost = Math.min(activeDays / 30, 1) * 15;
  const expectedDelta = Math.round(avgDelta * 0.7 + consistencyBoost);

  return {
    currentRating,
    predictedNextRating: Math.max(0, currentRating + expectedDelta),
    expectedDelta,
    bestCase: Math.max(0, currentRating + expectedDelta + 40),
    worstCase: Math.max(0, currentRating + expectedDelta - 50),
    confidence: Math.min(90, 40 + recent.length * 8 + Math.min(activeDays, 30)),
    reason: "Based on recent contest deltas and activity consistency.",
  };
};

const saveLeetCodeUpcomingContests = async (upcomingContests) => {
  if (!Array.isArray(upcomingContests) || upcomingContests.length === 0) return;

  const operations = upcomingContests
    .filter((contest) => contest.title && contest.startTime)
    .map((contest) => ({
      updateOne: {
        filter: {
          platform: "leetcode",
          contestId: contest.contestId || contest.title,
        },
        update: {
          $set: {
            platform: "leetcode",
            contestId: contest.contestId || contest.title,
            title: contest.title,
            url: contest.url || "https://leetcode.com/contest/",
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
            type: "LeetCode Contest",
            difficultyHint: "",
            isActive: true,
            rawData: contest,
          },
        },
        upsert: true,
      },
    }));

  if (operations.length > 0) {
    await UpcomingContest.bulkWrite(operations, { ordered: false });
  }
};

exports.fetchLeetCode = async (userId, handle) => {
  try {
    if (!handle) {
      throw new Error("LeetCode handle is required");
    }

    const username = handle.trim();

    const profileQuery = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
            userAvatar
            realName
            reputation
          }
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
          tagProblemCounts {
            advanced {
              tagName
              tagSlug
              problemsSolved
            }
            intermediate {
              tagName
              tagSlug
              problemsSolved
            }
            fundamental {
              tagName
              tagSlug
              problemsSolved
            }
          }
        }
      }
    `;

    const calendarQuery = `
      query getUserCalendar($username: String!) {
        userCalendar(username: $username) {
          activeYears
          streak
          totalActiveDays
          submissionCalendar
        }
      }
    `;

    const recentSubmissionQuery = `
      query getRecentAccepted($username: String!) {
        recentAcSubmissionList(username: $username, limit: 100) {
          title
          titleSlug
          timestamp
        }
      }
    `;

    const contestRankingQuery = `
      query getContestRanking($username: String!) {
        userContestRanking(username: $username) {
          attendedContestsCount
          rating
          globalRanking
          totalParticipants
          topPercentage
        }
      }
    `;

    const contestHistoryQuery = `
      query getContestHistory($username: String!) {
        userContestRankingHistory(username: $username) {
          attended
          trendDirection
          problemsSolved
          totalProblems
          finishTimeInSeconds
          rating
          ranking
          contest {
            title
            startTime
          }
        }
      }
    `;

    const upcomingQuery = `
      query upcomingContests {
        contestUpcomingContests {
          title
          titleSlug
          startTime
          duration
        }
      }
    `;

    const [
      profileResult,
      calendarResult,
      recentResult,
      contestRankingResult,
      contestHistoryResult,
      upcomingResult,
    ] = await Promise.allSettled([
      runLeetCodeQuery(profileQuery, { username }),
      runLeetCodeQuery(calendarQuery, { username }),
      runLeetCodeQuery(recentSubmissionQuery, { username }),
      runLeetCodeQuery(contestRankingQuery, { username }),
      runLeetCodeQuery(contestHistoryQuery, { username }),
      runLeetCodeQuery(upcomingQuery, {}),
    ]);

    if (profileResult.status !== "fulfilled") {
      throw profileResult.reason;
    }

    const profileData = profileResult.value;
    const matchedUser = profileData?.matchedUser;

    if (!matchedUser) {
      throw new Error("LeetCode handle not found");
    }

    const calendarData =
      calendarResult.status === "fulfilled" ? calendarResult.value : {};

    const recentData = recentResult.status === "fulfilled" ? recentResult.value : {};

    const contestRankingData =
      contestRankingResult.status === "fulfilled" ? contestRankingResult.value : {};

    const contestHistoryData =
      contestHistoryResult.status === "fulfilled" ? contestHistoryResult.value : {};

    const upcomingData =
      upcomingResult.status === "fulfilled" ? upcomingResult.value : {};

    const acceptedStats = matchedUser.submitStatsGlobal?.acSubmissionNum || [];

    const totalSolved =
      acceptedStats.find((item) => item.difficulty === "All")?.count || 0;

    const totalSubmissions =
      acceptedStats.find((item) => item.difficulty === "All")?.submissions || 0;

    const easy =
      acceptedStats.find((item) => item.difficulty === "Easy")?.count || 0;

    const easySubmissions =
      acceptedStats.find((item) => item.difficulty === "Easy")?.submissions || 0;

    const medium =
      acceptedStats.find((item) => item.difficulty === "Medium")?.count || 0;

    const mediumSubmissions =
      acceptedStats.find((item) => item.difficulty === "Medium")?.submissions || 0;

    const hard =
      acceptedStats.find((item) => item.difficulty === "Hard")?.count || 0;

    const hardSubmissions =
      acceptedStats.find((item) => item.difficulty === "Hard")?.submissions || 0;

    const tagGroups = matchedUser.tagProblemCounts || {};

    const allTags = [
      ...(tagGroups.fundamental || []),
      ...(tagGroups.intermediate || []),
      ...(tagGroups.advanced || []),
    ];

    const topicWise = {};

    allTags.forEach((tag) => {
      const key = normalizeTopic(tag.tagName);
      topicWise[key] = Number(tag.problemsSolved || 0);
    });

    if (!Object.keys(topicWise).length) {
      topicWise.mixed = Number(totalSolved || 0);
    }

    const calendar = calendarData?.userCalendar || {};
    const submissionCalendar = safeJsonParse(calendar.submissionCalendar, {});

    const calendarDates = Object.entries(submissionCalendar).map(([timestamp]) =>
      timestampToDate(timestamp)
    );

    const recentAccepted = Array.isArray(recentData?.recentAcSubmissionList)
      ? recentData.recentAcSubmissionList
      : [];

    const recentDates = recentAccepted.map((submission) =>
      timestampToDate(submission.timestamp)
    );

    const allDates = [...new Set([...calendarDates, ...recentDates])];

    if (allDates.length === 0) {
      console.warn(`⚠️ No submission dates found for LeetCode user ${username}`);
    } else {
      console.log(`✅ LeetCode: Found ${allDates.length} unique submission dates`);
    }

    const streakData = calculateStreaks(allDates);
    const activityMaps = buildActivityMaps(allDates);

    const recentProblemDetailsSettled = await Promise.allSettled(
      recentAccepted
        .slice(0, 30)
        .map((submission) => fetchProblemDetails(submission.titleSlug))
    );

    const problemDetailsMap = {};

    recentProblemDetailsSettled.forEach((item) => {
      if (item.status === "fulfilled" && item.value?.titleSlug) {
        problemDetailsMap[item.value.titleSlug] = item.value;
      }
    });

    const solvedProblemOps = [];
    const platformSubmissionOps = [];

    recentAccepted.forEach((submission) => {
      const detail = problemDetailsMap[submission.titleSlug] || {};

      const tags = Array.isArray(detail.topicTags)
        ? detail.topicTags.map((tag) => normalizeTopic(tag.name))
        : ["leetcode"];

      const date = timestampToDate(submission.timestamp);
      const submittedAt = timestampToDateObj(submission.timestamp);
      const problemUrl = submission.titleSlug
        ? `https://leetcode.com/problems/${submission.titleSlug}/`
        : "";

      solvedProblemOps.push({
        updateOne: {
          filter: {
            userId,
            platform: "leetcode",
            problemName: submission.title,
          },
          update: {
            $set: {
              userId,
              platform: "leetcode",
              problemName: submission.title,
              problemSlug: submission.titleSlug || "",
              problemUrl,
              topic: tags[0] || "leetcode",
              tags,
              difficulty: detail.difficulty || "Unknown",
              difficultyRating: 0,
              date,
              submittedAt,
              verdict: "AC",
              rawData: {
                source: "recentAcSubmissionList",
                submission,
                detail,
              },
            },
          },
          upsert: true,
        },
      });

      platformSubmissionOps.push({
        updateOne: {
          filter: {
            userId,
            platform: "leetcode",
            submissionId: `${submission.titleSlug || submission.title}-${submission.timestamp}`,
          },
          update: {
            $set: {
              userId,
              platform: "leetcode",
              submissionId: `${submission.titleSlug || submission.title}-${submission.timestamp}`,
              problemName: submission.title,
              problemSlug: submission.titleSlug || "",
              problemUrl,
              contestId: "",
              contestName: "",
              index: "",
              verdict: "AC",
              language: "",
              runtime: 0,
              memory: 0,
              difficulty: detail.difficulty || "Unknown",
              difficultyRating: 0,
              topic: tags[0] || "leetcode",
              tags,
              submittedAt,
              date,
              isAccepted: true,
              rawData: {
                source: "recentAcSubmissionList",
                submission,
                detail,
              },
            },
          },
          upsert: true,
        },
      });
    });

    const today = todayString();

    solvedProblemOps.push({
      updateOne: {
        filter: {
          userId,
          platform: "leetcode",
          problemName: "LeetCode Summary Snapshot",
          date: today,
        },
        update: {
          $set: {
            userId,
            platform: "leetcode",
            problemName: "LeetCode Summary Snapshot",
            problemSlug: "summary",
            problemUrl: `https://leetcode.com/${username}/`,
            topic: "mixed",
            tags: ["summary"],
            difficulty: "summary",
            difficultyRating: 0,
            date: today,
            submittedAt: new Date(),
            verdict: "SNAPSHOT",
            rawData: {
              totalSolved,
              easy,
              medium,
              hard,
            },
          },
        },
        upsert: true,
      },
    });

    if (solvedProblemOps.length > 0) {
      await SolvedProblem.bulkWrite(solvedProblemOps, { ordered: false });
    }

    if (platformSubmissionOps.length > 0) {
      await PlatformSubmission.bulkWrite(platformSubmissionOps, { ordered: false });
    }

    const contestRanking = contestRankingData?.userContestRanking || {};

    const contestHistoryRaw = Array.isArray(
      contestHistoryData?.userContestRankingHistory
    )
      ? contestHistoryData.userContestRankingHistory.filter((item) => item.attended)
      : [];

    let previousRating = 0;

    const ratingHistory = contestHistoryRaw.map((item) => {
      const currentRating = Math.round(Number(item.rating || 0));
      const oldRating = previousRating || currentRating;
      const ratingDelta = previousRating ? currentRating - previousRating : 0;

      previousRating = currentRating;

      return {
        rating: currentRating,
        oldRating,
        newRating: currentRating,
        ratingDelta,
        rank: item.ranking ? String(item.ranking) : "",
        contestRank: Number(item.ranking || 0),
        contestName: item.contest?.title || "",
        contestId: item.contest?.title || "",
        date: item.contest?.startTime ? timestampToDateObj(item.contest.startTime) : null,
      };
    });

    if (ratingHistory.length > 0) {
      const contestOps = ratingHistory.map((contest) => ({
        updateOne: {
          filter: {
            userId,
            platform: "leetcode",
            contestId: contest.contestId || contest.contestName,
          },
          update: {
            $set: {
              userId,
              platform: "leetcode",
              contestId: contest.contestId || contest.contestName,
              contestName: contest.contestName || "LeetCode Contest",
              contestUrl: contest.contestId
                ? `https://leetcode.com/contest/${contest.contestId}/`
                : "https://leetcode.com/contest/",
              rank: Number(contest.contestRank || 0),
              percentile: 0,
              totalParticipants: Number(contestRanking.totalParticipants || 0),
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

    const upcomingContests = Array.isArray(upcomingData?.contestUpcomingContests)
      ? upcomingData.contestUpcomingContests.map((contest) => ({
          contestId: contest.titleSlug || "",
          title: contest.title || "",
          platform: "leetcode",
          startTime: contest.startTime ? timestampToDateObj(contest.startTime) : null,
          durationSeconds: Number(contest.duration || 0),
          url: contest.titleSlug
            ? `https://leetcode.com/contest/${contest.titleSlug}/`
            : "https://leetcode.com/contest/",
          phase: "BEFORE",
        }))
      : [];

    await saveLeetCodeUpcomingContests(upcomingContests);

    const currentRating = Math.round(Number(contestRanking?.rating || 0));

    const ratingPrediction = predictLeetCodeRating(
      currentRating,
      ratingHistory,
      streakData.activeDays
    );

    const acceptedSubmissions = Number(
      easySubmissions + mediumSubmissions + hardSubmissions
    );

    const acceptanceRate = totalSubmissions
      ? Number(((acceptedSubmissions / totalSubmissions) * 100).toFixed(2))
      : 0;

    return {
      handle: username,
      totalSolved: Number(totalSolved || 0),
      easy: Number(easy || 0),
      medium: Number(medium || 0),
      hard: Number(hard || 0),

      topicWise,
      dates: allDates,

      streak: Number(calendar.streak || streakData.currentStreak || 0),
      maxStreak: streakData.maxStreak,
      activeDays: Number(calendar.totalActiveDays || streakData.activeDays || 0),

      rating: currentRating,
      maxRating: ratingHistory.length
        ? Math.max(...ratingHistory.map((item) => item.rating || 0))
        : currentRating,

      rank: matchedUser.profile?.ranking ? String(matchedUser.profile.ranking) : "",
      globalRank: Number(contestRanking?.globalRanking || matchedUser.profile?.ranking || 0),

      ratingHistory,
      upcomingContests,
      ratingPrediction,

      submissionsSummary: {
        totalSubmissions: Number(totalSubmissions || 0),
        acceptedSubmissions: Number(acceptedSubmissions || 0),
        acceptanceRate,
        activeDays: Number(calendar.totalActiveDays || streakData.activeDays || 0),
        maxStreak: streakData.maxStreak,
        currentStreak: Number(calendar.streak || streakData.currentStreak || 0),
        lastActiveDate: streakData.lastActiveDate,
        verdictWise: {
          AC: Number(acceptedSubmissions || 0),
        },
        languageWise: {},
        difficultyWise: {
          Easy: Number(easy || 0),
          Medium: Number(medium || 0),
          Hard: Number(hard || 0),
        },
        monthlyActivity: activityMaps.monthlyActivity,
        yearlyActivity: activityMaps.yearlyActivity,
      },

      profileMeta: {
        avatar: matchedUser.profile?.userAvatar || "",
        realName: matchedUser.profile?.realName || "",
        reputation: Number(matchedUser.profile?.reputation || 0),
        globalRanking: Number(matchedUser.profile?.ranking || 0),
      },

      status: "Linked",
      error: "",
      lastSyncedAt: new Date(),
    };
  } catch (error) {
    console.error(`Error fetching LeetCode stats for ${handle}:`, error.message);

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
        reason: "LeetCode sync failed.",
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
      },
      profileMeta: {},
      status: "Error",
      error: error.message,
      lastSyncedAt: new Date(),
    };
  }
};