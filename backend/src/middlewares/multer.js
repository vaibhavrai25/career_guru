const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /pdf/;
  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );

  const allowedMimeTypes = ["application/pdf"];
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }

  return cb(new Error("Only text-based PDF resumes are allowed right now."));
};

const upload = multer({
  storage,
  limits: {
    fileSize: 7 * 1024 * 1024,
  },
  fileFilter,
});

module.exports = upload;