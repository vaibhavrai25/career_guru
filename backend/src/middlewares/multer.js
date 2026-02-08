const multer = require('multer');
const path = require('path');

// Configure temporary disk storage
const storage = multer.diskStorage({});

// File filter to ensure only resumes are uploaded
const fileFilter = (req, file, cb) => {
  const filetypes = /pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Resumes must be PDF or Word documents!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit size to 5MB
  fileFilter,
});

module.exports = upload;