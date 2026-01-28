const mongoose = require('mongoose');

const solvedProblemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  platform: String,
  problemName: String,
  topic: String,
  difficulty: String,
  date: String,
});

module.exports = mongoose.model('SolvedProblem', solvedProblemSchema);
