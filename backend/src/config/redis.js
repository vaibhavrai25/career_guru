const Redis = require("ioredis");

let redisClient = null;

if (process.env.REDIS_URL) {
  // Pass optimal settings for Serverless Redis
  redisClient = new Redis(process.env.REDIS_URL, {
    retryStrategy: (times) => {
      // Reconnect automatically with a slight delay
      return Math.min(times * 50, 2000); 
    },
  });

  // Use .once() instead of .on() so it only logs the very first time
  redisClient.once("connect", () => {
    console.log("⚡ Redis Cache Connected Successfully");
  });

  redisClient.on("error", (err) => {
    // Suppress noisy network reset logs that are normal for serverless DBs
    if (err.message.includes("ECONNRESET") || err.message.includes("Connection is closed")) {
      return; 
    }
    console.error("Redis Error:", err.message);
  });
} else {
  console.warn("⚠️ REDIS_URL missing in .env - Caching layer is bypassed.");
}

module.exports = redisClient;