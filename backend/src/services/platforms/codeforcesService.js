const axios = require('axios');
const SolvedProblem = require('../../models/SolvedProblem');

exports.fetchCodeforces = async (userId, handle) => {
  try {
    const res = await axios.get(
      `https://codeforces.com/api/user.status?handle=${handle}`
    );

    if (res.data.status !== 'OK') {
      throw new Error('Codeforces API returned an error');
    }

    const submissions = res.data.result;
    const operations = [];

    for (let sub of submissions) {
      if (sub.verdict === 'OK') {
        // Prepare bulk operations for better performance
        operations.push({
          updateOne: {
            filter: {
              userId,
              platform: 'codeforces',
              problemName: sub.problem.name,
            },
            update: {
              topic: sub.problem.tags && sub.problem.tags.length > 0 ? sub.problem.tags[0] : 'General',
              difficulty: sub.problem.rating || 'Unknown',
              date: new Date(sub.creationTimeSeconds * 1000)
                .toISOString()
                .split('T')[0],
            },
            upsert: true,
          }
        });
      }
    }

    // Execute all updates in a single batch request
    if (operations.length > 0) {
      await SolvedProblem.bulkWrite(operations);
    }

    return { success: true, count: operations.length };
  } catch (error) {
    console.error(`Error fetching Codeforces stats for ${handle}:`, error.message);
    throw error;
  }
};