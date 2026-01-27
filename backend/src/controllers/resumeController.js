const cloudinary = require('../config/cloudinary');
const Profile = require('../models/Profile');
const streamifier = require('streamifier');

exports.uploadResume = async (req, res) => {
  try {
    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'resumes' },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    const result = await streamUpload();

    await Profile.findOneAndUpdate(
      { userId: req.user._id },
      { resumeUrl: result.secure_url },
      { new: true }
    );

    res.json({ message: 'Resume uploaded', url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
