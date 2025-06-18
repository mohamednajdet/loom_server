const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const { verifyUser } = require('../middleware/authMiddleware');
const User = require('../models/user');

router.post('/submit', verifyUser, async (req, res) => {
  try {
    const { q1, q2, q3, q4, notes } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    const newSurvey = new Survey({
      userId,
      phone: user.phone,
      q1,
      q2,
      q3,
      q4,
      notes,
    });

    await newSurvey.save();
    res.status(201).json({ success: true, message: '✅ تم حفظ الاستبيان' });
  } catch (err) {
    console.error('❌ خطأ أثناء حفظ الاستبيان:', err);
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

module.exports = router;
