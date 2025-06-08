// redisClient.js
const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  username: 'default',
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

(async () => {
  try {
    await redisClient.connect();
    console.log('✅ Connected to Redis Cloud');
  } catch (err) {
    console.error('❌ Failed to connect to Redis:', err);
  }
})();

module.exports = redisClient;
