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

const validateAndFetchAvatar = async (platform, handle) => {
  if (!platform || !handle) return null;

  const cleanHandle = handle.trim();

  try {
    if (platform === "github") {
      const res = await axios.get(`https://api.github.com/users/${cleanHandle}`, {
        timeout: 10000,
      });

      return res.data.avatar_url || null;
    }

    if (platform === "leetcode") {
      const query = {
        query: `
          query userPublicProfile($username: String!) {
            matchedUser(username: $username) {
              profile {
                userAvatar
              }
            }
          }
        `,
        variables: {
          username: cleanHandle,
        },
      };

      const res = await axios.post("https://leetcode.com/graphql", query, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      return res.data?.data?.matchedUser?.profile?.userAvatar || null;
    }

    if (platform === "codeforces") {
      const res = await axios.get(
        `https://codeforces.com/api/user.info?handles=${cleanHandle}`,
        { timeout: 10000 }
      );

      return res.data?.result?.[0]?.titlePhoto || null;
    }

    if (platform === "codechef") {
      try {
        const res = await axios.get(`https://codechef-api.vercel.app/${cleanHandle}`, {
          timeout: 10000,
        });

        if (res.data && res.data.status !== "Failed" && res.data.success !== false) {
          return res.data.profile || res.data.profileImage || null;
        }
      } catch (error) {
        const fallback = await axios.get(
          `https://codechef-api-five.vercel.app/${cleanHandle}`,
          { timeout: 10000 }
        );

        if (
          fallback.data &&
          fallback.data.status !== "Failed" &&
          fallback.data.success !== false
        ) {
          return fallback.data.profile || fallback.data.profileImage || null;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Validation failed for ${platform}:`, error.message);
    return null;
  }
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

    const normalizedUsername = username ? username.toLowerCase().trim() : "";

    if (normalizedUsername) {
      const existing = await Profile.findOne({
        username: normalizedUsername,
        userId: { $ne: req.user._id },
      });

      if (existing) {
        return res.status(400).json({
          message: "Username already taken",
        });
      }
    }

    let avatarUrl = "";

    const platformsForAvatar = [
      { platform: "github", handle: githubHandle },
      { platform: "leetcode", handle: leetcodeHandle },
      { platform: "codeforces", handle: codeforcesHandle },
      { platform: "codechef", handle: codechefHandle },
    ];

    for (const item of platformsForAvatar) {
      if (item.handle) {
        avatarUrl = await validateAndFetchAvatar(item.platform, item.handle);
        if (avatarUrl) break;
      }
    }

    const normalizedSkills = Array.isArray(skills)
      ? skills.map((skill) => String(skill).trim()).filter(Boolean)
      : skills
      ? String(skills)
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      : [];

    const updateData = {
      userId: req.user._id,
      name: name?.trim() || normalizedUsername || req.user.name || "",
      username: normalizedUsername || undefined,
      bio: bio || "Coding enthusiast",
      skills: normalizedSkills,
      isPublic: isPublic !== undefined ? Boolean(isPublic) : false,
      codeforcesHandle: codeforcesHandle?.trim() || "",
      leetcodeHandle: leetcodeHandle?.trim() || "",
      githubHandle: githubHandle?.trim() || "",
      codechefHandle: codechefHandle?.trim() || "",
      linkedinUrl: linkedinUrl?.trim() || "",
    };

    if (avatarUrl) {
      updateData.avatar = avatarUrl;
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
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

    const avatar = await validateAndFetchAvatar(cleanPlatform, cleanHandle);

    if (avatar) {
      return res.status(200).json({
        valid: true,
        avatar,
      });
    }

    return res.status(400).json({
      valid: false,
      message: "Handle not found or platform unavailable",
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