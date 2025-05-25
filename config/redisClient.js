// redisClient.js
import { createClient } from 'redis';

const redisClient = createClient({
  username: 'default',
  password: '8cShvJ1gDXcfeN5Oj7vDoiAv4pFsGDZZ',
  socket: {
    host: 'redis-18228.c274.us-east-1-3.ec2.redns.redis-cloud.com',
    port: 18228,
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

export default redisClient;
