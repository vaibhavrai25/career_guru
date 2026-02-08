const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Standardized Route Imports
const authRoutes = require('./src/routes/authRoutes');
const profileRoutes = require('./src/routes/ProfileRoutes');
const resumeRoutes = require('./src/routes/resumeRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const codingRoutes = require('./src/routes/codingRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const studyPlanRoutes = require('./src/routes/studyPlanRoutes');

// Route Declarations
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/stats', statsRoutes); // Ensure handlers in statsRoutes are now fixed
app.use("/api/study", studyPlanRoutes); // Standardized to /api/study for frontend compatibility

// Health Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running 🚀' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});