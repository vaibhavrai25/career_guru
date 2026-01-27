const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Load env variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
// test 101
// Middlewares
app.use(cors());
app.use(express.json()); // to read JSON body

const authRoutes = require('./src/routes/authRoutes');

app.use('/api/auth', authRoutes);
const profileRoutes = require('./src/routes/profileRoutes');
app.use('/api/profile', profileRoutes);



// Health Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running 🚀',
  });
});

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
