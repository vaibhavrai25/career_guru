const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const connectDB = require("./src/config/db");

dotenv.config();
const app = express();

require("./src/config/redis");

// 1. HTTP Header Security
app.use(helmet());

// 2. CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// 3. Global Rate Limiting (Protects against basic DoS and brute force)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again later." }
});
// app.use("/api", globalLimiter);

// 4. Payload Size Limits (Lowered to 500kb to prevent memory exhaustion DoS)
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));

// 5. NoSQL Injection Protection (Removes $ and . from req.body, req.query, req.params)
// 5. Safe NoSQL Injection Protection
const sanitizeOptions = { replaceWith: '_' };
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body, sanitizeOptions);
  if (req.params) req.params = mongoSanitize.sanitize(req.params, sanitizeOptions);
  next();
});

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
  res.status(200).json({ status: "OK", message: "Backend is operational" });
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
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err.message);

  if (err.message && err.message.startsWith("CORS blocked")) {
    return res.status(403).json({ message: err.message });
  }

  if (err.name === "MulterError" || err.type === 'entity.too.large') {
    return res.status(400).json({ message: "Payload or file too large." });
  }

  return res.status(err.statusCode || 500).json({
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(" Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();