const axios = require("axios");
const CodingProfile = require("../models/CodingProfile");

exports.fetchCodingStats = async (req, res) => {
  try {
    const { leetcode, codeforces, github } = req.body;

    if (!leetcode && !codeforces && !github) {
      return res.status(400).json({
        message: "At least one coding handle is required",
      });
    }

    const lcData = {};
    const cfData = {};
    const ghData = {};

    if (leetcode) {
      try {
        const lcRes = await axios.get(
          `https://leetcode-stats-api.herokuapp.com/${leetcode.trim()}`
        );

        Object.assign(lcData, {
          handle: leetcode.trim(),
          totalSolved: lcRes.data.totalSolved || 0,
          easy: lcRes.data.easySolved || 0,
          medium: lcRes.data.mediumSolved || 0,
          hard: lcRes.data.hardSolved || 0,
        });
      } catch (error) {
        console.error("LeetCode fetch failed:", error.message);
      }
    }

    if (codeforces) {
      try {
        const cfRes = await axios.get(
          `https://codeforces.com/api/user.info?handles=${codeforces.trim()}`
        );

        const cf = cfRes.data.result?.[0];

        if (cf) {
          Object.assign(cfData, {
            handle: codeforces.trim(),
            rating: cf.rating || 0,
            maxRating: cf.maxRating || 0,
            rank: cf.rank || "unrated",
          });
        }
      } catch (error) {
        console.error("Codeforces fetch failed:", error.message);
      }
    }

    if (github) {
      try {
        const ghRes = await axios.get(
          `https://api.github.com/users/${github.trim()}`
        );

        Object.assign(ghData, {
          handle: github.trim(),
          publicRepos: ghRes.data.public_repos || 0,
          followers: ghRes.data.followers || 0,
        });
      } catch (error) {
        console.error("GitHub fetch failed:", error.message);
      }
    }

    const updateData = {
      userId: req.user._id,
      lastSynced: new Date(),
    };

    if (leetcode) updateData.leetcode = lcData;
    if (codeforces) updateData.codeforces = cfData;
    if (github) updateData.github = ghData;

    const updatedProfile = await CodingProfile.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      message: "Coding stats fetched successfully",
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch coding stats",
      error: error.message,
    });
  }
};