const axios = require('axios');
const SolvedProblem = require('../../models/SolvedProblem');

exports.fetchLeetCode = async (userId, handle) => {
  try {
    // Note: Using a common public API wrapper for LeetCode stats
    const res = await axios.get(`https://leetcode-stats-api.herokuapp.com/${handle}`);
    
    if (res.data.status === 'error') {
      throw new Error('LeetCode handle not found');
    }

    // Since this specific API provides totals rather than a list of problems, 
    // we log the summary for the heatmap/stats. 
    // In a full implementation, you would use GraphQL to get individual problem dates.
    const today = new Date().toISOString().split('T')[0];

    await SolvedProblem.findOneAndUpdate(
      { userId, platform: 'leetcode', date: today },
      { 
        $set: { 
          topic: 'Mixed', 
          difficulty: 'Various',
          count: res.data.totalSolved 
        } 
      },
      { upsert: true }
    );

    return { success: true };
  } catch (error) {
    console.error(`Error fetching LeetCode stats: ${error.message}`);
    throw error;
  }
};