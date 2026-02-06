const Profile = require('../models/Profile');

// Create or Update Profile
exports.upsertProfile = async (req, res) => {
  try {
    const { education, skills, interests, targetRole, codeforcesHandle, leetcodeHandle, githubHandle, codechefHandle } = req.body;

    let profile = await Profile.findOne({ userId: req.user._id });

    if (profile) {
      profile.education = education;
      profile.skills = skills;
      profile.interests = interests;
      profile.targetRole = targetRole;
      profile.codeforcesHandle = codeforcesHandle;
profile.leetcodeHandle = leetcodeHandle;
profile.githubHandle = githubHandle;
profile.codechefHandle = codechefHandle;
      await profile.save();
    } else {
      profile = await Profile.create({
        userId: req.user._id,
        education,
        skills,
        interests,
        targetRole,
        codeforcesHandle,
  leetcodeHandle,
  githubHandle,
  codechefHandle,
      });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



