const axios = require('axios');
const CodingProfile = require('../models/CodingProfile');
const Profile = require('../models/Profile');
// today 1 feb works 


const fetchLeetCodeStats = async (username) => {
  const query = {
    query: `
      query userProfile($username: String!) {
        matchedUser(username: $username) {
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `,
    variables: { username }
  };

  const res = await axios.post(
    'https://leetcode.com/graphql',
    query,
    { headers: { 'Content-Type': 'application/json' } }
  );

  const stats =
    res.data.data.matchedUser.submitStats.acSubmissionNum;

  let easy = 0, medium = 0, hard = 0;

  stats.forEach(s => {
    if (s.difficulty === 'Easy') easy = s.count;
    if (s.difficulty === 'Medium') medium = s.count;
    if (s.difficulty === 'Hard') hard = s.count;
  });

  return {
    totalSolved: easy + medium + hard,
    easy,
    medium,
    hard,
  };
};


exports.syncCodeforces = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });

    if (!profile || !profile.codeforcesHandle) {
      return res.status(400).json({ message: "Add Codeforces handle in profile" });
    }

    const handle = profile.codeforcesHandle;

    // 🔥 Call Codeforces API
    const response = await axios.get(
      `https://codeforces.com/api/user.status?handle=${handle}`
    );

    const submissions = response.data.result;

    // ✅ Only accepted problems
    const solvedMap = new Map();
    const topicCount = {};

    submissions.forEach(sub => {
      if (sub.verdict === "OK") {
        const key = sub.problem.contestId + "-" + sub.problem.index;

        if (!solvedMap.has(key)) {
          solvedMap.set(key, true);

          // Count tags
          sub.problem.tags.forEach(tag => {
            topicCount[tag] = (topicCount[tag] || 0) + 1;
          });
        }
      }
    });

    const totalSolved = solvedMap.size;

    // ✅ Save in DB
    await CodingProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        codeforces: {
          handle,
          totalSolved,
          topicWise: topicCount,
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      message: "Codeforces synced",
      totalSolved,
      topics: topicCount,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.syncLeetCode = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });

    if (!profile || !profile.leetcodeHandle) {
      return res.status(400).json({ message: "Add LeetCode handle in profile" });
    }

    const leetcodeData = await fetchLeetCodeStats(
      profile.leetcodeHandle
    );

    await CodingProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        leetcode: {
          handle: profile.leetcodeHandle,
          ...leetcodeData,
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      message: "LeetCode synced",
      leetcode: leetcodeData,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOverviewStats = async (req, res) => {
  try {
    const codingProfile = await CodingProfile.findOne({
      userId: req.user._id,
    });

    if (!codingProfile) {
      return res.json({
        totalSolved: 0,
        codeforcesSolved: 0,
        leetcodeSolved: 0,
        mostActivePlatform: null,
      });
    }

    const codeforcesSolved =
      codingProfile.codeforces?.totalSolved || 0;

    const leetcodeSolved =
      codingProfile.leetcode?.totalSolved || 0;

    const totalSolved = codeforcesSolved + leetcodeSolved;

    let mostActivePlatform = null;

    if (codeforcesSolved > leetcodeSolved) {
      mostActivePlatform = 'Codeforces';
    } else if (leetcodeSolved > codeforcesSolved) {
      mostActivePlatform = 'LeetCode';
    } else if (totalSolved > 0) {
      mostActivePlatform = 'Equal';
    }

    res.json({
      totalSolved,
      codeforcesSolved,
      leetcodeSolved,
      mostActivePlatform,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const SolvedProblem = require('../models/SolvedProblem');

exports.getConsistencyStats = async (req, res) => {
  try {
    const problems = await SolvedProblem.find(
      { userId: req.user._id },
      { date: 1, _id: 0 }
    );

    if (!problems.length) {
      return res.json({
        currentStreak: 0,
        longestStreak: 0,
        activeDaysLast30: 0,
        consistencyScore: 0,
      });
    }

    // unique sorted dates
    const dates = [...new Set(problems.map(p => p.date))].sort();

    // helper
    const toDate = d => new Date(d);
    const diffDays = (a, b) =>
      (toDate(b) - toDate(a)) / (1000 * 60 * 60 * 24);

    // 🔥 longest streak
    let longest = 1, current = 1;

    for (let i = 1; i < dates.length; i++) {
      if (diffDays(dates[i - 1], dates[i]) === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }

    // 🔥 current streak (till today)
    let today = new Date().toISOString().split('T')[0];
    let currStreak = 0;

    for (let i = dates.length - 1; i >= 0; i--) {
      if (diffDays(dates[i], today) === currStreak) {
        currStreak++;
      } else {
        break;
      }
    }

    // 🔥 active days last 30
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);

    const activeDaysLast30 = dates.filter(
      d => new Date(d) >= last30
    ).length;

    // 🔥 consistency score (simple & explainable)
    const consistencyScore = Math.min(
      100,
      Math.round((activeDaysLast30 / 30) * 100)
    );

    res.json({
      currentStreak: currStreak,
      longestStreak: longest,
      activeDaysLast30,
      consistencyScore,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDifficultyTrend = async (req, res) => {
  try {
    const codingProfile = await CodingProfile.findOne({
      userId: req.user._id,
    });

    if (!codingProfile || !codingProfile.leetcode) {
      return res.json({
        easy: 0,
        medium: 0,
        hard: 0,
        trend: "No data",
        focusSuggestion: "Solve problems consistently",
      });
    }

    const { easy = 0, medium = 0, hard = 0 } = codingProfile.leetcode;

    let trend = "Balanced";
    let focusSuggestion = "Maintain balance";

    if (medium > easy && hard > medium) {
      trend = "Strong Growth";
      focusSuggestion = "Continue Hard problems";
    } else if (medium > easy) {
      trend = "Improving";
      focusSuggestion = "Increase Hard problems";
    } else if (easy > medium) {
      trend = "Beginner Phase";
      focusSuggestion = "Move towards Medium problems";
    }

    res.json({
      easy,
      medium,
      hard,
      trend,
      focusSuggestion,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTopicStrength = async (req, res) => {
  try {
    const codingProfile = await CodingProfile.findOne({
      userId: req.user._id,
    });

    if (
      !codingProfile ||
      !codingProfile.codeforces ||
      !codingProfile.codeforces.topicWise
    ) {
      return res.json({
        strong: [],
        average: [],
        weak: [],
      });
    }

    const topicWise = codingProfile.codeforces.topicWise;

    const entries = Object.entries(topicWise);

    // sort descending by count
    entries.sort((a, b) => b[1] - a[1]);

    const strong = [];
    const average = [];
    const weak = [];

    entries.forEach(([topic, count]) => {
      if (count >= 40) {
        strong.push(topic);
      } else if (count >= 15) {
        average.push(topic);
      } else {
        weak.push(topic);
      }
    });

    res.json({
      strong,
      average,
      weak,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCodingPersona = async (req, res) => {
  try {
    const codingProfile = await CodingProfile.findOne({
      userId: req.user._id,
    });

    if (!codingProfile || !codingProfile.leetcode) {
      return res.json({
        persona: "New Learner",
        reason: "Not enough data available",
      });
    }

    const { easy = 0, medium = 0, hard = 0 } = codingProfile.leetcode;

    const total = easy + medium + hard;

    if (total === 0) {
      return res.json({
        persona: "New Learner",
        reason: "No solved problems yet",
      });
    }

    let persona = "Balanced Coder";
    let reason = "Solving problems across difficulties";

    const hardRatio = hard / total;
    const mediumRatio = medium / total;

    if (hardRatio >= 0.3) {
      persona = "Competitive Programmer";
      reason = "High proportion of hard problems solved";
    } else if (mediumRatio >= 0.5 && hardRatio < 0.2) {
      persona = "Interview-Focused Solver";
      reason = "Strong focus on medium-level interview problems";
    } else if (easy / total >= 0.6) {
      persona = "Beginner Explorer";
      reason = "Mostly solving easy problems";
    }

    res.json({
      persona,
      reason,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getDashboardSummary = async (req, res) => {
  try {
    const codingProfile = await CodingProfile.findOne({
      userId: req.user._id,
    });

    if (!codingProfile) {
      return res.json({
        totalSolved: 0,
        streak: 0,
        strongestTopic: "-",
        topics: {},
      });
    }

    // ✅ total solved (CF + LC)
    const cfSolved = codingProfile.codeforces?.totalSolved || 0;
    const lcSolved = codingProfile.leetcode?.totalSolved || 0;
    const totalSolved = cfSolved + lcSolved;

    // ✅ strongest topic (from CF tags)
    const topics = codingProfile.codeforces?.topicWise || {};

    let strongestTopic = "-";
    if (Object.keys(topics).length) {
      strongestTopic = Object.keys(topics).reduce((a, b) =>
        topics[a] > topics[b] ? a : b
      );
    }

    // ✅ get streak from your existing engine
    const problems = await SolvedProblem.find(
      { userId: req.user._id },
      { date: 1, _id: 0 }
    );

    const dates = [...new Set(problems.map(p => p.date))].sort();

    const toDate = d => new Date(d);
    const diffDays = (a, b) =>
      (toDate(b) - toDate(a)) / (1000 * 60 * 60 * 24);

    let today = new Date().toISOString().split('T')[0];
    let streak = 0;

    for (let i = dates.length - 1; i >= 0; i--) {
      if (diffDays(dates[i], today) === streak) {
        streak++;
      } else {
        break;
      }
    }

    res.json({
      totalSolved,
      streak,
      strongestTopic,
      topics,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
