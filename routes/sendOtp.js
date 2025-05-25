const express = require('express');
const router = express.Router();
const axios = require('axios');
const dotenv = require('dotenv');
const qs = require('qs');
const redis = require('redis');

dotenv.config();

// ✅ إعداد Redis Client
const redisClient = redis.createClient({
  username: 'default',
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT)
  }
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect();

// ✅ دالة توليد رمز OTP مكون من 6 أرقام
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: 'رقم الهاتف مطلوب' });
  }

  const otp = generateOtp();
  const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');

  try {
    // ✅ إرسال الرسالة عبر Twilio
    await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      qs.stringify({
        To: phone,
        From: process.env.TWILIO_PHONE_NUMBER,
        Body: `رمز التحقق الخاص بك هو: ${otp}`,
      }),
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // ✅ خزن الرمز في Redis لمدة دقيقتين
    await redisClient.set(`otp:${phone}`, otp, {
      EX: 120, // expires in 120 seconds
    });

    return res.status(200).json({
      message: 'تم إرسال رمز التحقق بنجاح',
    });
  } catch (error) {
    console.error('OTP Send Error:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'فشل إرسال رمز التحقق',
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;
