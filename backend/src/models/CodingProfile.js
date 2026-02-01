const mongoose = require('mongoose');

const codingProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  leetcode: {
    username: String,
    totalSolved: Number,
    easy: Number,
    medium: Number,
    hard: Number,
  },

  codeforces: {
    username: String,
    rating: Number,
    maxRating: Number,
    rank: String,
  },

  github: {
    username: String,
    publicRepos: Number,
    followers: Number,
  },

  codechef: {
    username: String,
    rating: Number,
    stars: String,
  },
});

module.exports = mongoose.model('CodingProfile', codingProfileSchema);
