const axios = require("axios");
const CodingProfile = require("../models/CodingProfile");
const Profile = require("../models/Profile");
const SolvedProblem = require("../models/SolvedProblem");

const getDate = (ts) =>
  new Date(ts * 1000).toISOString().split("T")[0];
exports.syncCodeforces = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    const handle = profile.codeforcesHandle;

    const response = await axios.get(
      `https://codeforces.com/api/user.status?handle=${handle}`
    );

    const submissions = response.data.result;

    const solvedMap = new Map();
    const topicWise = {};
    const dates = new Set();

    submissions.forEach((sub) => {
      if (sub.verdict === "OK") {
        const key = sub.problem.contestId + "-" + sub.problem.index;

        if (!solvedMap.has(key)) {
          solvedMap.set(key, true);

          sub.problem.tags.forEach((tag) => {
            topicWise[tag] = (topicWise[tag] || 0) + 1;
          });
        }

        dates.add(getDate(sub.creationTimeSeconds));
      }
    });

    await CodingProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        codeforces: {
          handle,
          totalSolved: solvedMap.size,
          topicWise,
          dates: [...dates],
        },
      },
      { upsert: true, new: true }
    );

    res.json({ message: "Codeforces synced" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.syncCodeforces = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });

    if (!profile || !profile.codeforcesHandle) {
      return res.status(400).json({ message: "Add Codeforces handle in profile" });
    }

    const handle = profile.codeforcesHandle;

    const response = await axios.get(
      `https://codeforces.com/api/user.status?handle=${handle}`
    );

    const submissions = response.data.result;

    const solvedMap = new Map();
    const topicCount = {};
    const dates = new Set();   // ⭐ IMPORTANT

    submissions.forEach(sub => {
      if (sub.verdict === "OK") {
        const key = sub.problem.contestId + "-" + sub.problem.index;

        if (!solvedMap.has(key)) {
          solvedMap.set(key, true);

          // ⭐ SAVE DATE
          const date = new Date(sub.creationTimeSeconds * 1000)
            .toISOString()
            .split("T")[0];

          dates.add(date);

          // count tags
          sub.problem.tags.forEach(tag => {
            topicCount[tag] = (topicCount[tag] || 0) + 1;
          });
        }
      }
    });

    const totalSolved = solvedMap.size;

    await CodingProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        codeforces: {
          handle,
          totalSolved,
          topicWise: topicCount,
          dates: [...dates],   // ⭐ SAVE DATES
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      message: "Codeforces synced with dates",
      totalSolved,
      daysActive: dates.size,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.syncLeetCode = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    const username = profile.leetcodeHandle;

    const resLC = await axios.get(
      "https://leetcode.com/api/problems/all/"
    );

    const problems = resLC.data.stat_status_pairs;

    let totalSolved = 0;
    let topicWise = {};
    let dates = new Set();
    let easy = 0,
      medium = 0,
      hard = 0;

    problems.forEach((p) => {
      if (p.status === "ac") {
        totalSolved++;

        const diff = p.difficulty.level;
        if (diff === 1) easy++;
        if (diff === 2) medium++;
        if (diff === 3) hard++;

        if (p.topic_tags) {
          p.topic_tags.forEach((tag) => {
            topicWise[tag.name] =
              (topicWise[tag.name] || 0) + 1;
          });
        }

        dates.add(getDate(p.stat.last_submission_ts));
      }
    });

    await CodingProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        leetcode: {
          handle: username,
          totalSolved,
          topicWise,
          dates: [...dates],
          easy,
          medium,
          hard,
        },
      },
      { upsert: true, new: true }
    );

    res.json({ message: "LeetCode synced" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.buildSolvedHistory = async (req, res) => {
  try {
    const coding = await CodingProfile.findOne({
      userId: req.user._id,
    });

    if (!coding) {
      return res.json({ message: "No coding data found" });
    }

    const entries = [];

    // ✅ Codeforces dates
    (coding.codeforces?.dates || []).forEach(date => {
      entries.push({
        userId: req.user._id,
        platform: "Codeforces",
        date,
      });
    });

    // ✅ LeetCode dates
    (coding.leetcode?.dates || []).forEach(date => {
      entries.push({
        userId: req.user._id,
        platform: "LeetCode",
        date,
      });
    });

    await SolvedProblem.deleteMany({ userId: req.user._id });
    await SolvedProblem.insertMany(entries);

    res.json({
      message: "Solved history built",
      inserted: entries.length,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTopicStrength = async (req, res) => {
  const coding = await CodingProfile.findOne({
    userId: req.user._id,
  });

  const combined = {
    ...(coding.codeforces?.topicWise || {}),
    ...(coding.leetcode?.topicWise || {}),
  };

  res.json(combined);
};
exports.getConsistencyStats = async (req, res) => {
  const problems = await SolvedProblem.find(
    { userId: req.user._id },
    { date: 1, _id: 0 }
  );

  const dates = [...new Set(problems.map((p) => p.date))].sort();

  const toDate = (d) => new Date(d);
  const diffDays = (a, b) =>
    (toDate(b) - toDate(a)) / (1000 * 60 * 60 * 24);

  let longest = 0,
    current = 0;

  for (let i = 1; i < dates.length; i++) {
    if (diffDays(dates[i - 1], dates[i]) === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  res.json({ longestStreak: longest + 1 });
};
exports.getHeatmapDates = async (req, res) => {
  const problems = await SolvedProblem.find(
    { userId: req.user._id },
    { date: 1, _id: 0 }
  );

  res.json(problems.map((p) => p.date));
};
