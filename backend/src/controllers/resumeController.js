const cloudinary = require('../config/cloudinary');
const Profile = require('../models/Profile');
const streamifier = require('streamifier');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'resumes', resource_type: 'auto' },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req);

    // Save the Cloudinary URL to the user's profile
    const updatedProfile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      { resumeUrl: result.secure_url },
      { new: true, upsert: true }
    );

    res.json({ 
      message: 'Resume uploaded and profile updated', 
      url: result.secure_url,
      profile: updatedProfile 
    });
  } catch (err) {
    console.error("Resume Upload Error:", err);
    res.status(500).json({ error: err.message });
  }
};