const axios = require("axios");
const Profile = require("../models/Profile");
const CodingProfile = require("../models/CodingProfile");

const toPlainObject = (value) => {
  if (!value) return {};

  if (value instanceof Map) {
    return Object.fromEntries(value);
  }

  if (typeof value.toObject === "function") {
    return value.toObject();
  }

  if (typeof value === "object") {
    return value;
  }

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
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
});

const validatePlatformHandle = async (platform, handle) => {
  if (!platform || !handle) {
    return {
      valid: false,
      avatar: "",
      message: "Platform and handle are required",
    };
  }

  const cleanPlatform = platform.toLowerCase().trim();
  const cleanHandle = handle.trim();

  try {
    if (cleanPlatform === "github") {
      const res = await axios.get(`https://api.github.com/users/${cleanHandle}`, {
        timeout: 15000,
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "Career-Guru-App",
        },
      });

      return {
        valid: true,
        avatar: res.data.avatar_url || "",
        message: "GitHub handle found",
        meta: {
          username: res.data.login,
          publicRepos: res.data.public_repos,
          followers: res.data.followers,
        },
      };
    }

    if (cleanPlatform === "leetcode") {
      const query = {
        query: `
          query userPublicProfile($username: String!) {
            matchedUser(username: $username) {
              username
              profile {
                userAvatar
                realName
                ranking
              }
              submitStatsGlobal {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
            }
          }
        `,
        variables: {
          username: cleanHandle,
        },
      };

      const res = await axios.post("https://leetcode.com/graphql", query, {
        headers: getLeetCodeHeaders(),
        timeout: 15000,
      });

      const matchedUser = res.data?.data?.matchedUser;

      if (!matchedUser) {
        return {
          valid: false,
          avatar: "",
          message: "LeetCode handle not found",
        };
      }

      return {
        valid: true,
        avatar: matchedUser.profile?.userAvatar || "",
        message: "LeetCode handle found",
        meta: {
          username: matchedUser.username,
          ranking: matchedUser.profile?.ranking,
        },
      };
    }

    if (cleanPlatform === "codeforces") {
      const res = await axios.get(
        `https://codeforces.com/api/user.info?handles=${encodeURIComponent(cleanHandle)}`,
        { timeout: 15000 }
      );

      const user = res.data?.result?.[0];

      if (!user) {
        return {
          valid: false,
          avatar: "",
          message: "Codeforces handle not found",
        };
      }

      return {
        valid: true,
        avatar: user.titlePhoto || user.avatar || "",
        message: "Codeforces handle found",
        meta: {
          handle: user.handle,
          rating: user.rating || 0,
          rank: user.rank || "unrated",
        },
      };
    }

    if (cleanPlatform === "codechef") {
      let data = null;

      try {
        const res = await axios.get(`https://codechef-api.vercel.app/${cleanHandle}`, {
          timeout: 15000,
        });
        data = res.data;
      } catch (error) {
        const fallback = await axios.get(
          `https://codechef-api-five.vercel.app/${cleanHandle}`,
          { timeout: 15000 }
        );
        data = fallback.data;
      }

      if (!data || data.status === "Failed" || data.success === false) {
        return {
          valid: false,
          avatar: "",
          message: "CodeChef handle not found",
        };
      }

      return {
        valid: true,
        avatar: data.profile || data.profileImage || "",
        message: "CodeChef handle found",
        meta: {
          handle: cleanHandle,
          rating: data.currentRating || data.rating || 0,
          stars: data.stars || "",
        },
      };
    }

    return {
      valid: false,
      avatar: "",
      message: "Unsupported platform",
    };
  } catch (error) {
    console.error(`Validation failed for ${platform}:`, error.message);

    return {
      valid: false,
      avatar: "",
      message: error.response?.data?.comment || error.message,
    };
  }
};

const pickAvatarFromValidHandle = async ({
  githubHandle,
  leetcodeHandle,
  codeforcesHandle,
  codechefHandle,
}) => {
  const platformsForAvatar = [
    { platform: "github", handle: githubHandle },
    { platform: "leetcode", handle: leetcodeHandle },
    { platform: "codeforces", handle: codeforcesHandle },
    { platform: "codechef", handle: codechefHandle },
  ];

  for (const item of platformsForAvatar) {
    if (!item.handle) continue;

    const result = await validatePlatformHandle(item.platform, item.handle);
    if (result.valid && result.avatar) {
      return result.avatar;
    }
  }

  return "";
};

exports.upsertProfile = async (req, res) => {
  try {
    const {
      name,
      username,
      bio,
      skills,
      isPublic,
      codeforcesHandle,
      leetcodeHandle,
      githubHandle,
      codechefHandle,
      linkedinUrl,
    } = req.body;

    

    // if (!normalizedUsername) {
    //   return res.status(400).json({
    //     message: "Username is required",
    //   });
    // }

    const normalizedUsername = username ? username.toLowerCase().trim() : "";

    //  Only look for an existing username if one was actually provided
    let existing = null;
    if (normalizedUsername) {
      existing = await Profile.findOne({
        username: normalizedUsername,
        userId: { $ne: req.user._id },
      });
    }

    if (existing) {
      return res.status(400).json({
        message: "Username already taken",
      });
    }

    const normalizedSkills = Array.isArray(skills)
      ? skills.map((skill) => String(skill).trim()).filter(Boolean)
      : skills
      ? String(skills)
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      : [];

    const cleanHandles = {
      codeforcesHandle: codeforcesHandle?.trim() || "",
      leetcodeHandle: leetcodeHandle?.trim() || "",
      githubHandle: githubHandle?.trim() || "",
      codechefHandle: codechefHandle?.trim() || "",
    };

    const avatarUrl = await pickAvatarFromValidHandle(cleanHandles);

    const updateData = {
      userId: req.user._id,
      name: name?.trim() || normalizedUsername || req.user.name || "",
      username: normalizedUsername,
      bio: bio || "Coding enthusiast",
      skills: normalizedSkills,
      isPublic: isPublic !== undefined ? Boolean(isPublic) : false,
      ...cleanHandles,
      linkedinUrl: linkedinUrl?.trim() || "",
    };

    if (avatarUrl) {
      updateData.avatar = avatarUrl;
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      message: "Profile saved successfully. You can now sync coding stats.",
      profile,
    });
  } catch (error) {
    console.error("Profile Upsert Error:", error.message);

    return res.status(500).json({
      message: "Failed to save profile",
      error: error.message,
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error("Get Profile Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

exports.validateHandle = async (req, res) => {
  try {
    const { platform, handle } = req.query;

    if (!platform || !handle) {
      return res.status(400).json({
        valid: false,
        message: "Platform and handle are required",
      });
    }

    const cleanPlatform = platform.toLowerCase().trim();
    const cleanHandle = handle.trim();

    if (cleanPlatform === "username") {
      const normalizedUsername = cleanHandle.toLowerCase();

      const existing = await Profile.findOne({
        username: normalizedUsername,
      });

      const isOwner =
        req.user &&
        existing &&
        existing.userId.toString() === req.user._id.toString();

      if (!existing || isOwner) {
        return res.status(200).json({
          valid: true,
          message: "Username available",
        });
      }

      return res.status(400).json({
        valid: false,
        message: "Username already taken",
      });
    }

    const supportedPlatforms = ["github", "leetcode", "codeforces", "codechef"];

    if (!supportedPlatforms.includes(cleanPlatform)) {
      return res.status(400).json({
        valid: false,
        message: "Unsupported platform",
      });
    }

    const result = await validatePlatformHandle(cleanPlatform, cleanHandle);

    if (result.valid) {
      return res.status(200).json({
        valid: true,
        avatar: result.avatar || "",
        message: result.message,
        meta: result.meta || {},
      });
    }

    return res.status(400).json({
      valid: false,
      message: result.message || "Handle not found or platform unavailable",
    });
  } catch (error) {
    console.error("Handle Validation Error:", error.message);

    return res.status(400).json({
      valid: false,
      message: error.message,
    });
  }
};

exports.getPublicProfileData = async (req, res) => {
  try {
    const { username } = req.params;

    const profile = await Profile.findOne({
      username: username.toLowerCase().trim(),
      isPublic: true,
    });

    if (!profile) {
      return res.status(404).json({
        message: "Public profile not found",
      });
    }

    const coding = await CodingProfile.findOne({ userId: profile.userId });

    const combinedTopics = mergeTopics(
      coding?.codeforces?.topicWise,
      coding?.leetcode?.topicWise,
      coding?.codechef?.topicWise
    );

    const totalSolved =
      Number(coding?.codeforces?.totalSolved || 0) +
      Number(coding?.leetcode?.totalSolved || 0) +
      Number(coding?.codechef?.totalSolved || 0);

    return res.status(200).json({
      personal: {
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
        avatar: profile.avatar,
        skills: profile.skills || [],
        github: profile.githubHandle,
        linkedin: profile.linkedinUrl,
        resumeUrl: profile.resumeUrl,
      },
      stats: {
        totalSolved,
        topics: combinedTopics,
        difficulty: {
          easy:
            Number(coding?.codeforces?.easy || 0) +
            Number(coding?.leetcode?.easy || 0) +
            Number(coding?.codechef?.easy || 0),
          medium:
            Number(coding?.codeforces?.medium || 0) +
            Number(coding?.leetcode?.medium || 0) +
            Number(coding?.codechef?.medium || 0),
          hard:
            Number(coding?.codeforces?.hard || 0) +
            Number(coding?.leetcode?.hard || 0) +
            Number(coding?.codechef?.hard || 0),
        },
        platforms: {
          leetcode: coding?.leetcode || {},
          codeforces: coding?.codeforces || {},
          codechef: coding?.codechef || {},
          github: coding?.github || {},
        },
      },
    });
  } catch (error) {
    console.error("Public Profile Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch public profile",
      error: error.message,
    });
  }
};