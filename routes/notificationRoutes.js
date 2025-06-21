const express = require('express');
const router = express.Router();
const { verifyUser } = require('../middleware/authMiddleware');
const User = require('../models/user');
const admin = require('firebase-admin');

// ✅ إرسال إشعار Push Notification لمستخدم معيّن حسب userId ويدعم إعدادات الإشعارات
router.post('/smart-push', verifyUser, async (req, res) => {
  try {
    const { title, body, userId, type = "general" } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ message: 'البيانات ناقصة' });
    }

    // جلب المستخدم والتأكد من وجود FCM Token
    const user = await User.findById(userId);
    if (!user || !user.fcmToken) {
      return res.status(404).json({ message: 'FCM Token غير موجود لهذا المستخدم' });
    }

    // التحقق من إعدادات الإشعارات لهذا النوع
    if (
      !user.notificationSettings ||
      user.notificationSettings[type] === false
    ) {
      // إذا المستخدم موقف هذا النوع من الإشعارات، لا ترسل
      return res.status(200).json({
        message: `المستخدم موقف إشعارات (${type})، لم يتم الإرسال`
      });
    }

    // بناء الرسالة
    const message = {
      notification: { title, body },
      token: user.fcmToken,
      data: {
        type: type,
      }
    };

    // إرسال الإشعار عبر Firebase Admin
    await admin.messaging().send(message);

    res.json({ message: 'تم إرسال الإشعار بنجاح' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'فشل إرسال الإشعار' });
  }
});

module.exports = router;
