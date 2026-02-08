const Profile = require('../models/Profile');
const CodingProfile = require('../models/CodingProfile');
const axios = require('axios');

// Helper: Platform handle validate karne aur Avatar nikalne ke liye
const validateAndFetchAvatar = async (platform, handle) => {
  if (!handle) return null;
  try {
    if (platform === 'github') {
      const res = await axios.get(`https://api.github.com/users/${handle.trim()}`);
      return res.data.avatar_url; 
    }
    
    if (platform === 'leetcode') {
      const query = JSON.stringify({
        query: `query userPublicProfile($username: String!) {
          matchedUser(username: $username) { profile { userAvatar } }
        }`,
        variables: { username: handle.trim() }
      });
      const res = await axios.post("https://leetcode.com/graphql", query, {
        headers: { 'Content-Type': 'application/json' }
      });
      return res.data.data.matchedUser?.profile?.userAvatar;
    }

    if (platform === 'codeforces') {
      const res = await axios.get(`https://codeforces.com/api/user.info?handles=${handle.trim()}`);
      return res.data.result?.[0]?.titlePhoto || null; 
    }

    if (platform === 'codechef') {
      // Using the same mirror API we used for syncing
      const res = await axios.get(`https://codechef-api-five.vercel.app/${handle.trim()}`);
      if (res.data && res.data.success !== false) {
        return res.data.profile || null; // API provides profile pic URL
      }
      throw new Error("Profile not found on CodeChef");
    }
  } catch (err) {
    console.error(`Validation failed for ${platform}:`, err.message);
    throw new Error(`Invalid ${platform} handle: ${handle}`);
  }
};

// --- 1. Create or Update Profile ---
exports.upsertProfile = async (req, res) => {
  try {
    const { 
      name, username, bio, skills, isPublic,
      codeforcesHandle, leetcodeHandle, githubHandle, codechefHandle 
    } = req.body;

    // 1. Check if username is taken
    if (username) {
      const existing = await Profile.findOne({ 
        username: username.toLowerCase().trim(), 
        userId: { $ne: req.user._id } 
      });
      if (existing) return res.status(400).json({ message: "Username already taken" });
    }

    // 2. Avatar Sync Strategy (GitHub > LeetCode > CodeChef)
    let avatarUrl = "";
    try {
      avatarUrl = await validateAndFetchAvatar('github', githubHandle) || 
                  await validateAndFetchAvatar('leetcode', leetcodeHandle) ||
                  await validateAndFetchAvatar('codechef', codechefHandle);
    } catch (vError) {
      // Agar handle invalid hai toh yahi se error bhej denge
      return res.status(400).json({ message: vError.message });
    }

    const updateData = {
      userId: req.user._id,
      name, 
      username: username?.toLowerCase().trim(), 
      bio, 
      skills: Array.isArray(skills) ? skills : skills?.split(',').map(s => s.trim()),
      isPublic: Boolean(isPublic),
      codeforcesHandle, 
      leetcodeHandle, 
      githubHandle, 
      codechefHandle,
    };

    if (avatarUrl) updateData.avatar = avatarUrl;

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    // 3. Update CodingProfile status to 'Linked'
    const platforms = ['leetcode', 'codeforces', 'codechef'];
    let codingProfile = await CodingProfile.findOne({ userId: req.user._id });
    
    if (!codingProfile) {
      codingProfile = new CodingProfile({ userId: req.user._id });
    }

    platforms.forEach(p => {
      const handle = req.body[`${p}Handle`];
      if (handle) {
        // Sirf tab update karo jab handle naya ho ya Linked na ho
        if (!codingProfile[p] || codingProfile[p].handle !== handle) {
          codingProfile[p] = { 
            ...codingProfile[p], 
            handle: handle.trim(), 
            status: 'Linked' 
          };
        }
      }
    });

    await codingProfile.save();

    res.json({ message: "Profile & Handles Updated Successfully", profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 2. Real-time Handle Validation Endpoint ---
exports.validateHandle = async (req, res) => {
  const { platform, handle } = req.query;
  try {
    const avatar = await validateAndFetchAvatar(platform, handle);
    res.json({ 
      valid: true, 
      message: `${platform} handle is valid!`,
      avatar: avatar 
    });
  } catch (err) {
    res.status(400).json({ valid: false, message: err.message });
  }
};

// --- 3. Get Profile ---
exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};