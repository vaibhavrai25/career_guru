const axios = require("axios");
const Profile = require("../models/Profile");
const CodingProfile = require("../models/CodingProfile");
const redisClient = require("../config/redis");

const toPlainObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value.toObject === "function") return value.toObject();
  if (typeof value === "object") return value;
  return {};
};

const mergeTopics = (...topicObjects) => {
  const merged = {};
  topicObjects.forEach((topics) => {
    const plainTopics = toPlainObject(topics);
    Object.entries(plainTopics).forEach(([tag, count]) => {
      const key = String(tag || "").toLowerCase().trim();
      if (!key) return;
      merged[key] = (merged[key] || 0) + Number(count || 0);
    });
  });
  return merged;
};

const getLeetCodeHeaders = () => ({
  "Content-Type": "application/json",
  Referer: "https://leetcode.com",
  Origin: "https://leetcode.com",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
});

const validatePlatformHandle = async (platform, handle) => {
  if (!platform || !handle) return { valid: false, avatar: "", message: "Platform and handle are required" };
  const cleanPlatform = platform.toLowerCase().trim();
  const cleanHandle = handle.trim();

  try {
    if (cleanPlatform === "github") {
      const res = await axios.get(`https://api.github.com/users/${cleanHandle}`, {
        timeout: 15000,
        headers: { Accept: "application/vnd.github+json", "User-Agent": "Career-Guru-App" },
      });
      return { valid: true, avatar: res.data.avatar_url || "", message: "GitHub handle found", meta: { username: res.data.login, publicRepos: res.data.public_repos, followers: res.data.followers } };
    }
    if (cleanPlatform === "leetcode") {
      const query = { query: `query userPublicProfile($username: String!) { matchedUser(username: $username) { username profile { userAvatar realName ranking } submitStatsGlobal { acSubmissionNum { difficulty count } } } }`, variables: { username: cleanHandle } };
      const res = await axios.post("https://leetcode.com/graphql", query, { headers: getLeetCodeHeaders(), timeout: 15000 });
      const matchedUser = res.data?.data?.matchedUser;
      if (!matchedUser) return { valid: false, avatar: "", message: "LeetCode handle not found" };
      return { valid: true, avatar: matchedUser.profile?.userAvatar || "", message: "LeetCode handle found", meta: { username: matchedUser.username, ranking: matchedUser.profile?.ranking } };
    }
    if (cleanPlatform === "codeforces") {
      const res = await axios.get(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(cleanHandle)}`, { timeout: 15000 });
      const user = res.data?.result?.[0];
      if (!user) return { valid: false, avatar: "", message: "Codeforces handle not found" };
      return { valid: true, avatar: user.titlePhoto || user.avatar || "", message: "Codeforces handle found", meta: { handle: user.handle, rating: user.rating || 0, rank: user.rank || "unrated" } };
    }
    if (cleanPlatform === "codechef") {
      let data = null;
      try {
        const res = await axios.get(`https://codechef-api.vercel.app/${cleanHandle}`, { timeout: 15000 });
        data = res.data;
      } catch (error) {
        const fallback = await axios.get(`https://codechef-api-five.vercel.app/${cleanHandle}`, { timeout: 15000 });
        data = fallback.data;
      }
      if (!data || data.status === "Failed" || data.success === false) return { valid: false, avatar: "", message: "CodeChef handle not found" };
      return { valid: true, avatar: data.profile || data.profileImage || "", message: "CodeChef handle found", meta: { handle: cleanHandle, rating: data.currentRating || data.rating || 0, stars: data.stars || "" } };
    }
    return { valid: false, avatar: "", message: "Unsupported platform" };
  } catch (error) {
    return { valid: false, avatar: "", message: error.response?.data?.comment || error.message };
  }
};

const pickAvatarFromValidHandle = async ({ githubHandle, leetcodeHandle, codeforcesHandle, codechefHandle }) => {
  const platformsForAvatar = [{ platform: "github", handle: githubHandle }, { platform: "leetcode", handle: leetcodeHandle }, { platform: "codeforces", handle: codeforcesHandle }, { platform: "codechef", handle: codechefHandle }];
  for (const item of platformsForAvatar) {
    if (!item.handle) continue;
    const result = await validatePlatformHandle(item.platform, item.handle);
    if (result.valid && result.avatar) return result.avatar;
  }
  return "";
};

exports.upsertProfile = async (req, res) => {
  try {
    const { name, username, bio, skills, isPublic, codeforcesHandle, leetcodeHandle, githubHandle, codechefHandle, linkedinUrl } = req.body;
    const normalizedUsername = username ? username.toLowerCase().trim() : "";

    // Check for username conflict
    if (normalizedUsername) {
      const existing = await Profile.findOne({ username: normalizedUsername, userId: { $ne: req.user._id } });
      if (existing) return res.status(400).json({ message: "Username already taken" });
    }

    const cleanHandles = { 
      codeforcesHandle: codeforcesHandle?.trim() || undefined, 
      leetcodeHandle: leetcodeHandle?.trim() || undefined, 
      githubHandle: githubHandle?.trim() || undefined, 
      codechefHandle: codechefHandle?.trim() || undefined 
    };

    // Prepare update data (Filter out undefined to allow partial updates)
    const updateData = { userId: req.user._id };
    if (name !== undefined) updateData.name = name.trim();
    if (username !== undefined) updateData.username = normalizedUsername;
    if (bio !== undefined) updateData.bio = bio;
    if (skills !== undefined) updateData.skills = Array.isArray(skills) ? skills : String(skills).split(",").map(s => s.trim());
    if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic);
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl.trim();
    
    // Assign handles only if they exist in the request
    Object.keys(cleanHandles).forEach(key => { if (cleanHandles[key]) updateData[key] = cleanHandles[key]; });

    // Update avatar only if handles are provided
    const avatarUrl = await pickAvatarFromValidHandle(cleanHandles);
    if (avatarUrl) updateData.avatar = avatarUrl;

    // Use runValidators: false for partial Onboarding saves, or handle carefully
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user._id }, 
      { $set: updateData }, 
      { new: true, upsert: true, runValidators: false } 
    );

    if (redisClient && normalizedUsername) {
      try { await redisClient.del(`portfolio:${normalizedUsername}`); } catch (e) { console.warn("Redis Delete Failed"); }
    }

    return res.status(200).json({ message: "Profile updated successfully.", profile });
  } catch (error) {
    console.error("CRITICAL ERROR IN upsertProfile:", error);
    return res.status(500).json({ message: "Failed to save profile", error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    return res.status(200).json(profile);
  } catch (error) { return res.status(500).json({ message: "Failed to fetch profile", error: error.message }); }
};

exports.validateHandle = async (req, res) => {
  try {
    const { platform, handle } = req.query;
    if (!platform || !handle) return res.status(400).json({ valid: false, message: "Platform and handle are required" });
    
    if (platform === "username") {
      const existing = await Profile.findOne({ username: handle.toLowerCase().trim() });
      const isOwner = req.user && existing && existing.userId.toString() === req.user._id.toString();
      return (existing && !isOwner) ? res.status(400).json({ valid: false, message: "Username taken" }) : res.status(200).json({ valid: true });
    }

    const result = await validatePlatformHandle(platform, handle);
    return result.valid ? res.status(200).json(result) : res.status(400).json(result);
  } catch (error) { return res.status(400).json({ valid: false, message: error.message }); }
};

exports.getPublicProfileData = async (req, res) => {
  try {
    const { username } = req.params;
    const normalizedUsername = username.toLowerCase().trim();
    const cacheKey = `portfolio:${normalizedUsername}`;

    if (redisClient) {
      try { const cached = await redisClient.get(cacheKey); if (cached) return res.status(200).json(JSON.parse(cached)); } catch (e) {}
    }

    const profile = await Profile.findOne({ username: normalizedUsername, isPublic: true });
    if (!profile) return res.status(404).json({ message: "Public profile not found" });

    const coding = await CodingProfile.findOne({ userId: profile.userId });
    const combinedTopics = mergeTopics(coding?.codeforces?.topicWise, coding?.leetcode?.topicWise, coding?.codechef?.topicWise);
    const totalSolved = Number(coding?.codeforces?.totalSolved || 0) + Number(coding?.leetcode?.totalSolved || 0) + Number(coding?.codechef?.totalSolved || 0);

    const responsePayload = {
      personal: { name: profile.name, username: profile.username, bio: profile.bio, avatar: profile.avatar, skills: profile.skills || [], github: profile.githubHandle, linkedin: profile.linkedinUrl },
      stats: { totalSolved, topics: combinedTopics, platforms: { leetcode: coding?.leetcode || {}, codeforces: coding?.codeforces || {}, codechef: coding?.codechef || {}, github: coding?.github || {} } }
    };

    if (redisClient) try { await redisClient.setex(cacheKey, 86400, JSON.stringify(responsePayload)); } catch (e) {}
    return res.status(200).json(responsePayload);
  } catch (error) { return res.status(500).json({ message: "Error fetching profile", error: error.message }); }
};