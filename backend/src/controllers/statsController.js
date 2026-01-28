const axios = require('axios');
const CodingProfile = require('../models/CodingProfile');
const Profile = require('../models/Profile');

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
