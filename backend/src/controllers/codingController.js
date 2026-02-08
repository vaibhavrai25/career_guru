const axios = require('axios');
const CodingProfile = require('../models/CodingProfile');

exports.fetchCodingStats = async (req, res) => {
  try {
    const { leetcode, codeforces, github } = req.body;
    let lcData = {}, cfData = {}, ghData = {};

    // 🔹 LeetCode - Wrap in try-catch to prevent total failure if one API is down
    try {
      const lcRes = await axios.get(`https://leetcode-stats-api.herokuapp.com/${leetcode}`);
      lcData = {
        handle: leetcode,
        totalSolved: lcRes.data.totalSolved || 0,
        easy: lcRes.data.easySolved || 0,
        medium: lcRes.data.mediumSolved || 0,
        hard: lcRes.data.hardSolved || 0,
      };
    } catch (e) { console.error("LeetCode fetch failed"); }

    // 🔹 Codeforces
    try {
      const cfRes = await axios.get(`https://codeforces.com/api/user.info?handles=${codeforces}`);
      const cf = cfRes.data.result[0];
      cfData = {
        handle: codeforces,
        rating: cf.rating || 0,
        maxRating: cf.maxRating || 0,
        rank: cf.rank || "unrated",
      };
    } catch (e) { console.error("Codeforces fetch failed"); }

    // 🔹 GitHub
    try {
      const ghRes = await axios.get(`https://api.github.com/users/${github}`);
      ghData = {
        handle: github,
        publicRepos: ghRes.data.public_repos || 0,
        followers: ghRes.data.followers || 0,
      };
    } catch (e) { console.error("GitHub fetch failed"); }

    const updatedProfile = await CodingProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        leetcode: lcData,
        codeforces: cfData,
        github: ghData,
        lastSynced: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Coding stats fetched successfully', data: updatedProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};