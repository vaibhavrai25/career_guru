const axios = require('axios');
const CodingProfile = require('../models/CodingProfile');

exports.fetchCodingStats = async (req, res) => {
  try {
    const { leetcode, codeforces, github } = req.body;

    // 🔹 LeetCode
    const lcRes = await axios.get(
      `https://leetcode-stats-api.herokuapp.com/${leetcode}`
    );

    // 🔹 Codeforces
    const cfRes = await axios.get(
      `https://codeforces.com/api/user.info?handles=${codeforces}`
    );
    const cf = cfRes.data.result[0];

    // 🔹 GitHub
    const ghRes = await axios.get(
      `https://api.github.com/users/${github}`
    );

    const data = {
      userId: req.user._id,

      leetcode: {
        username: leetcode,
        totalSolved: lcRes.data.totalSolved,
        easy: lcRes.data.easySolved,
        medium: lcRes.data.mediumSolved,
        hard: lcRes.data.hardSolved,
      },

      codeforces: {
        username: codeforces,
        rating: cf.rating,
        maxRating: cf.maxRating,
        rank: cf.rank,
      },

      github: {
        username: github,
        publicRepos: ghRes.data.public_repos,
        followers: ghRes.data.followers,
      },
    };

    await CodingProfile.findOneAndUpdate(
      { userId: req.user._id },
      data,
      { upsert: true, new: true }
    );

    res.json({ message: 'Coding stats fetched', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
