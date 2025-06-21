const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { verifyUser } = require('../middleware/authMiddleware'); // ✅ استدعاء

router.post('/', verifyUser, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.userId; // ✅ مأخوذ من التوكن

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'الرسالة مطلوبة' });
    }

    // هنا راح تحتاج تجيب رقم الهاتف من قاعدة البيانات إذا مو محفوظ بالتوكن
    const User = require('../models/user'); // ✅
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    const newFeedback = new Feedback({
      message,
      userId,
      phone: user.phone,
    });

    await newFeedback.save();

    return res.status(201).json({ success: true, message: '✅ تم حفظ الرسالة' });
  } catch (err) {
    console.error('❌ خطأ في حفظ الشكوى:', err);
    return res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

module.exports = router;
