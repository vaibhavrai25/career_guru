const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Explicitly set strictQuery to suppress warnings in Mongoose 7+
    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Prevent long hangs if DB is unreachable
      serverSelectionTimeoutMS: 5000, 
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;