const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db");

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman, server-to-server requests, and allowed frontend origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Route imports
const authRoutes = require("./src/routes/authRoutes");
const profileRoutes = require("./src/routes/profileRoutes");
const resumeRoutes = require("./src/routes/resumeRoutes");
const aiRoutes = require("./src/routes/aiRoutes");
const codingRoutes = require("./src/routes/codingRoutes");
const statsRoutes = require("./src/routes/statsRoutes");
const studyPlanRoutes = require("./src/routes/studyPlanRoutes");

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Career Guru backend is operational",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/study", studyPlanRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err.message);

  if (err.message && err.message.startsWith("CORS blocked")) {
    return res.status(403).json({
      message: err.message,
    });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({
      message: err.message,
    });
  }

  return res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error",
  });
});

// Server initialization
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB Atlas first
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();