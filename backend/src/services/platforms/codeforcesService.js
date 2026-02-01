const axios = require('axios');
const SolvedProblem = require('../../models/SolvedProblem');

exports.fetchCodeforces = async (userId, handle) => {
  const res = await axios.get(
    `https://codeforces.com/api/user.status?handle=${handle}`
  );

  const submissions = res.data.result;

  for (let sub of submissions) {
    if (sub.verdict === 'OK') {
      await SolvedProblem.updateOne(
        {
          userId,
          platform: 'codeforces',
          problemName: sub.problem.name,
        },
        {
          topic: sub.problem.tags[0],
          difficulty: sub.problem.rating || 'Unknown',
          date: new Date(sub.creationTimeSeconds * 1000)
            .toISOString()
            .split('T')[0],
        },
        { upsert: true }
      );
    }
  }
};
