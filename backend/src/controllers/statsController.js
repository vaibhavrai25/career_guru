const axios = require("axios");
const CodingProfile = require("../models/CodingProfile");
const Profile = require("../models/Profile");
const SolvedProblem = require("../models/SolvedProblem");

const getDate = (ts) => new Date(ts * 1000).toISOString().split("T")[0];

const mergeTopics = (...topicObjects) => {
  const merged = {};
  topicObjects.forEach(topics => {
    Object.entries(topics || {}).forEach(([tag, count]) => {
      const key = tag.toLowerCase().trim();
      merged[key] = (merged[key] || 0) + count;
    });
  });
  return merged;
};

// --- 1. CODEFORCES SYNC ---
exports.syncCodeforces = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile?.codeforcesHandle) return res.status(400).json({ message: "Handle missing" });

    const response = await axios.get(`https://codeforces.com/api/user.status?handle=${profile.codeforcesHandle}`);
    const solvedMap = new Map();
    const topicCount = {};
    const dates = new Set();
    let easy = 0, medium = 0, hard = 0;

    response.data.result.forEach(sub => {
      if (sub.verdict === "OK") {
        const key = `${sub.problem.contestId}-${sub.problem.index}`;
        if (!solvedMap.has(key)) {
          solvedMap.set(key, true);
          dates.add(getDate(sub.creationTimeSeconds));
          const r = sub.problem.rating || 800;
          if (r < 1200) easy++;
          else if (r < 1600) medium++;
          else hard++;
          if (sub.problem.tags) {
            sub.problem.tags.forEach(tag => topicCount[tag] = (topicCount[tag] || 0) + 1);
          }
        }
      }
    });

    await CodingProfile.findOneAndUpdate(
      { userId: req.user._id },
      { codeforces: { 
          handle: profile.codeforcesHandle, 
          totalSolved: solvedMap.size, 
          topicWise: topicCount, 
          dates: [...dates], 
          easy, medium, hard,
          status: 'Linked'
        } 
      },
      { upsert: true, new: true }
    );
    res.json({ message: "Codeforces Synced Successfully" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- 2. LEETCODE SYNC ---
exports.syncLeetCode = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile?.leetcodeHandle) return res.status(400).json({ message: "Handle missing" });

    const query = JSON.stringify({
      query: `query userProfile($username: String!) {
        matchedUser(username: $username) {
          submitStats { acSubmissionNum { difficulty, count } }
          tagProblemCounts {
            advanced { tagName, problemsSolved }
            intermediate { tagName, problemsSolved }
            fundamental { tagName, problemsSolved }
          }
          userCalendar { submissionCalendar }
        }
      }`,
      variables: { username: profile.leetcodeHandle.trim() }
    });

    const response = await axios.post("https://leetcode.com/graphql", query, {
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });

    const data = response.data.data.matchedUser;
    const stats = data.submitStats.acSubmissionNum;
    const topicWise = {};
    const tags = [...(data.tagProblemCounts.advanced || []), ...(data.tagProblemCounts.intermediate || []), ...(data.tagProblemCounts.fundamental || [])];
    tags.forEach(t => topicWise[t.tagName] = (topicWise[t.tagName] || 0) + t.problemsSolved);

    const calendarJson = JSON.parse(data.userCalendar.submissionCalendar || "{}");
    const dates = Object.keys(calendarJson).map(ts => new Date(parseInt(ts) * 1000).toISOString().split("T")[0]);

    await CodingProfile.findOneAndUpdate(
      { userId: req.user._id },
      { leetcode: { 
          handle: profile.leetcodeHandle, 
          totalSolved: stats.find(s => s.difficulty === "All").count,
          easy: stats.find(s => s.difficulty === "Easy")?.count || 0,
          medium: stats.find(s => s.difficulty === "Medium")?.count || 0,
          hard: stats.find(s => s.difficulty === "Hard")?.count || 0,
          topicWise, dates,
          status: 'Linked'
        } 
      },
      { upsert: true, new: true }
    );
    res.json({ message: "LeetCode Fully Synced!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- 3. CODECHEF SYNC ---
exports.syncCodechef = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile?.codechefHandle) return res.status(400).json({ message: "Handle missing" });

    const response = await axios.get(`https://codechef-api-five.vercel.app/${profile.codechefHandle.trim()}`);
    const data = response.data;

    if (!data || data.success === false) return res.status(404).json({ message: "CodeChef profile not found" });

    // 1. Calculate Total Solved from HeatMap
    const totalSolvedFromHeatMap = (data.heatMap || []).reduce((sum, entry) => sum + (entry.value || 0), 0);
    
    // 2. Extract Rating and Stars
    const rating = Number(data.currentRating || 0);
    const stars = data.stars || "1★";
    const starCount = parseInt(stars[0]) || 1;

    // 3. Extract Dates for Heatmap Sync
    const solvedDates = (data.heatMap || []).map(entry => entry.date);

    // 4. Difficulty Mapping based on Stars
    let easy = 0, medium = 0, hard = 0;
    if (starCount <= 2) easy = totalSolvedFromHeatMap;
    else if (starCount <= 4) medium = totalSolvedFromHeatMap;
    else hard = totalSolvedFromHeatMap;

    await CodingProfile.findOneAndUpdate(
      { userId: req.user._id },
      { 
        $set: {
          codechef: { 
            handle: profile.codechefHandle, 
            totalSolved: totalSolvedFromHeatMap,
            rating: rating,
            rank: stars,
            easy, medium, hard,
            status: 'Linked',
            dates: solvedDates
          } 
        }
      },
      { upsert: true, new: true }
    );

    res.json({ 
      message: "CodeChef Synced via HeatMap!", 
      solved: totalSolvedFromHeatMap, 
      rating, 
      stars 
    });
  } catch (err) { res.status(500).json({ error: "CodeChef Sync Error: " + err.message }); }
};

// --- 4. DASHBOARD SUMMARY ---
exports.getDashboardSummary = async (req, res) => {
  try {
    const coding = await CodingProfile.findOne({ userId: req.user._id });
    if (!coding) return res.status(404).json({ message: "Sync required" });

    // Terminal Logging for Debugging
    console.log("Final Stats Summary -> CF:", coding.codeforces?.totalSolved || 0, "LC:", coding.leetcode?.totalSolved || 0, "CC:", coding.codechef?.totalSolved || 0);

    const problems = await SolvedProblem.find({ userId: req.user._id }).sort({ date: 1 });
    const dates = [...new Set(problems.map(p => p.date))];
    let streak = 0;
    if (dates.length > 0) {
      let count = 1;
      for (let i = dates.length - 1; i > 0; i--) {
        if (Math.round((new Date(dates[i]) - new Date(dates[i-1])) / 86400000) === 1) count++;
        else break;
      }
      streak = count;
    }

    const combinedTopics = mergeTopics(
      coding.codeforces?.topicWise, 
      coding.leetcode?.topicWise, 
      coding.codechef?.topicWise
    );

    const S = Number(coding.codeforces?.totalSolved || 0) + 
              Number(coding.leetcode?.totalSolved || 0) + 
              Number(coding.codechef?.totalSolved || 0);

    const D = Object.keys(combinedTopics).length;
    const sScore = Math.min((S / 500) * 40, 40);
    const dScore = Math.min((D / 30) * 30, 30);
    const cScore = Math.min((streak / 30) * 30, 30);
    const irs = Math.round(sScore + dScore + cScore);

    res.json({
      totalSolved: S,
      streak: streak,
      irs: irs,
      strongestTopic: Object.entries(combinedTopics).sort((a,b) => b[1]-a[1])[0]?.[0] || "None",
      difficultyStats: {
        easy: (coding.codeforces?.easy || 0) + (coding.leetcode?.easy || 0) + (coding.codechef?.easy || 0),
        medium: (coding.codeforces?.medium || 0) + (coding.leetcode?.medium || 0) + (coding.codechef?.medium || 0),
        hard: (coding.codeforces?.hard || 0) + (coding.leetcode?.hard || 0) + (coding.codechef?.hard || 0),
      },
      topics: combinedTopics
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Analytics helper functions
exports.getOverviewStats = async (req, res) => {
  try {
    const coding = await CodingProfile.findOne({ userId: req.user._id });
    const S = Number(coding?.codeforces?.totalSolved || 0) + 
              Number(coding?.leetcode?.totalSolved || 0) + 
              Number(coding?.codechef?.totalSolved || 0);
    const platforms = (coding?.codeforces ? 1 : 0) + (coding?.leetcode ? 1 : 0) + (coding?.codechef ? 1 : 0);
    res.json({ totalSolved: S, platformsCount: platforms });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getHeatmapDates = async (req, res) => {
  try {
    const problems = await SolvedProblem.find({ userId: req.user._id }).select("date -_id");
    res.json(problems.map(p => p.date));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getConsistencyStats = async (req, res) => {
  try {
    const problems = await SolvedProblem.find({ userId: req.user._id }).sort({ date: 1 });
    const dates = [...new Set(problems.map(p => p.date))];
    if (dates.length === 0) return res.json({ currentStreak: 0, longestStreak: 0 });
    let longest = 0, current = 1;
    for (let i = 1; i < dates.length; i++) {
      if (Math.round((new Date(dates[i]) - new Date(dates[i-1])) / 86400000) === 1) current++;
      else { longest = Math.max(longest, current); current = 1; }
    }
    res.json({ currentStreak: current, longestStreak: Math.max(longest, current) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getTopicStrength = async (req, res) => {
  try {
    const coding = await CodingProfile.findOne({ userId: req.user._id });
    res.json(mergeTopics(coding?.codeforces?.topicWise, coding?.leetcode?.topicWise, coding?.codechef?.topicWise));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.buildSolvedHistory = async (req, res) => {
  try {
    const coding = await CodingProfile.findOne({ userId: req.user._id });
    const allDates = new Set([
      ...(coding?.codeforces?.dates || []), 
      ...(coding?.leetcode?.dates || []),
      ...(coding?.codechef?.dates || [])
    ]);
    const operations = [...allDates].map(date => ({
      updateOne: { filter: { userId: req.user._id, date: date }, update: { userId: req.user._id, date: date }, upsert: true }
    }));
    if (operations.length > 0) await SolvedProblem.bulkWrite(operations);
    res.json({ message: "History built!", totalActiveDays: allDates.size });
  } catch (err) { res.status(500).json({ error: err.message }); }
};