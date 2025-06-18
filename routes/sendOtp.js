const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const redisClient = require('../config/redisClient');

dotenv.config();

// ✅ تنسيق رقم الهاتف
function normalizePhoneNumber(phone) {
  const raw = phone.replace(/\s+/g, '');
  if (raw.startsWith('+964')) return raw;
  if (raw.startsWith('0')) return `+964${raw.substring(1)}`;
  if (raw.startsWith('7')) return `+964${raw}`;
  return raw;
}

// ✅ إرسال رمز تحقق وهمي
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

  const formattedPhone = normalizePhoneNumber(phone);
  const otp = '123456'; // رمز ثابت مؤقت

  try {
    console.log(`✅ [DEV] OTP for ${formattedPhone}: ${otp}`);
    await redisClient.set(`otp:${formattedPhone}`, otp, { EX: 120 });

    return res.status(200).json({ message: '✅ [DEV] تم إرسال رمز التحقق بنجاح (وهمي)' });
  } catch (error) {
    console.error('❌ OTP Send Error:', error.message);
    return res.status(500).json({ message: 'فشل إرسال رمز التحقق' });
  }
});

// ✅ التحقق من الرمز لتسجيل الدخول
router.post('/verify-otp', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ message: 'رقم الهاتف والرمز مطلوبان' });

  const formattedPhone = normalizePhoneNumber(phone);

  try {
    const storedOtp = await redisClient.get(`otp:${formattedPhone}`);
    if (!storedOtp) return res.status(400).json({ message: 'انتهت صلاحية الرمز أو غير موجود' });
    if (storedOtp !== code) return res.status(401).json({ message: 'رمز التحقق غير صحيح' });

    await redisClient.del(`otp:${formattedPhone}`);

    const user = await User.findOne({ phone: formattedPhone });
    if (!user) return res.status(404).json({ message: 'الحساب غير موجود، يرجى التسجيل أولاً' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'تم التحقق من الرمز بنجاح ✅',
      token,
      user,
    });
  } catch (error) {
    console.error('OTP Verify Error:', error.message);
    res.status(500).json({ message: 'حدث خطأ أثناء التحقق من الرمز' });
  }
});

// ✅ التحقق من الرمز وإنشاء الحساب
router.post('/verify-otp-register', async (req, res) => {
  const { phone, code, name, gender } = req.body;
  if (!phone || !code || !name || !gender) {
    return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
  }

  const formattedPhone = normalizePhoneNumber(phone);

  try {
    const storedOtp = await redisClient.get(`otp:${formattedPhone}`);
    if (!storedOtp) return res.status(400).json({ message: 'انتهت صلاحية الرمز أو غير موجود' });
    if (storedOtp !== code) return res.status(401).json({ message: 'رمز التحقق غير صحيح' });

    await redisClient.del(`otp:${formattedPhone}`);

    const existingUser = await User.findOne({ phone: formattedPhone });
    if (existingUser) {
      return res.status(400).json({ message: 'رقم الهاتف مسجل بالفعل' });
    }

    const newUser = new User({
      name,
      phone: formattedPhone,
      gender,
    });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      message: 'تم إنشاء الحساب والتحقق بنجاح ✅',
      user: newUser,
      token,
    });
  } catch (error) {
    console.error('OTP Verify Register Error:', error.message);
    res.status(500).json({ message: 'حدث خطأ أثناء التحقق من الرمز' });
  }
});

// ✅ التحقق من الرمز لتغيير رقم الهاتف
router.post('/verify-otp-change-phone', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ message: 'رقم الهاتف والرمز مطلوبان' });
  }

  const formattedPhone = normalizePhoneNumber(phone);

  try {
    const storedOtp = await redisClient.get(`otp:${formattedPhone}`);
    if (!storedOtp) {
      return res.status(400).json({ message: 'انتهت صلاحية الرمز أو غير موجود' });
    }

    if (storedOtp !== code) {
      return res.status(401).json({ message: 'رمز التحقق غير صحيح' });
    }

    await redisClient.del(`otp:${formattedPhone}`);

    return res.status(200).json({
      message: 'تم التحقق من الرمز بنجاح ✅',
      phone: formattedPhone,
    });
  } catch (error) {
    console.error('OTP Change Phone Verify Error:', error.message);
    return res.status(500).json({ message: 'حدث خطأ أثناء التحقق من الرمز' });
  }
});

module.exports = router;
