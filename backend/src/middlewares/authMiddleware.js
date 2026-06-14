const jwt = require("jsonwebtoken");
const User = require("../models/user");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized, no token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      console.error("CRITICAL SECURITY ERROR: JWT_SECRET is missing.");
      return res.status(500).json({
        message: "Internal server configuration error",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify the decoded ID exists and is a valid format before querying DB
    if (!decoded || !decoded.id || typeof decoded.id !== 'string') {
       return res.status(401).json({ message: "Not authorized, invalid token payload" });
    }

    const user = await User.findById(decoded.id).select("-password").lean();

    if (!user) {
      return res.status(401).json({
        message: "Not authorized, user no longer exists",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, token validation failed",
    });
  }
};

module.exports = { protect };