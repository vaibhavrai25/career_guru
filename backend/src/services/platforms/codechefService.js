const axios = require('axios');
const SolvedProblem = require('../../models/SolvedProblem');

exports.fetchCodechef = async (userId, handle) => {
  try {
    // Note: CodeChef doesn't have an official public API; using a common scraper/wrapper
    const res = await axios.get(`https://codechef-api.vercel.app/${handle}`);

    if (!res.data || res.data.status === 'Failed') {
      throw new Error('CodeChef handle not found');
    }

    const today = new Date().toISOString().split('T')[0];

    await SolvedProblem.findOneAndUpdate(
      { userId, platform: 'codechef', date: today },
      { 
        $set: { 
          topic: 'Competitive Programming', 
          difficulty: res.data.currentRating || 'Unknown' 
        } 
      },
      { upsert: true }
    );

    return { success: true };
  } catch (error) {
    console.error(`Error fetching CodeChef stats: ${error.message}`);
    throw error;
  }
};