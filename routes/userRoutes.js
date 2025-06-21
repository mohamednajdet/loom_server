const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { verifyUser } = require('../middleware/authMiddleware');

// ✅ إنشاء حساب جديد
router.post('/register', async (req, res) => {
  try {
    const { name, phone, gender, role } = req.body;
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(400).json({ message: 'المستخدم مسجل من قبل' });
    }

    const newUser = new User({ name, phone, gender, role: role || 'user' });
    await newUser.save();

    return res.status(201).json({
      message: 'تم إنشاء المستخدم بنجاح ✅',
      user: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقًا',
      error: error.message,
    });
  }
});

// ✅ تسجيل الدخول
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: 'رقم الهاتف غير مسجل لدينا' });
    }

    if (user.isBanned) {
      return res.status(403).json({
        message: 'تم حظرك من استخدام التطبيق ❌',
        supportMessage: 'للمساعدة تواصل مع خدمة العملاء عبر واتساب:',
        whatsappLink: 'https://wa.me/9647856863932',
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      message: 'تم تسجيل الدخول بنجاح',
      user,
      role: user.role,
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'حدث خطأ أثناء تسجيل الدخول',
      error: error.message,
    });
  }
});

// ✅ جلب كل المستخدمين
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: 'فشل في جلب المستخدمين',
      error: error.message,
    });
  }
});

// ✅ تعديل المفضلة
router.put('/favorites/:userId', async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

    const index = user.favorites.indexOf(productId);
    if (index === -1) {
      user.favorites.push(productId);
    } else {
      user.favorites.splice(index, 1);
    }

    await user.save();
    res.status(200).json({ favorites: user.favorites });
  } catch (error) {
    res.status(500).json({
      message: 'حدث خطأ أثناء تعديل المفضلة',
      error: error.message,
    });
  }
});

// ✅ جلب المفضلة
router.get('/favorites/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('favorites');
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

    res.status(200).json({ favorites: user.favorites });
  } catch (error) {
    res.status(500).json({
      message: 'حدث خطأ أثناء جلب المفضلة',
      error: error.message,
    });
  }
});

// ✅ حذف منتج من المفضلة
router.delete('/favorites/:userId/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

    const index = user.favorites.indexOf(productId);
    if (index > -1) {
      user.favorites.splice(index, 1);
      await user.save();
    }

    res.status(200).json({ message: 'تم حذف المنتج من المفضلة بنجاح' });
  } catch (error) {
    res.status(500).json({
      message: 'حدث خطأ أثناء حذف المنتج من المفضلة',
      error: error.message,
    });
  }
});

// ✅ حذف الحساب
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.status(200).json({ message: 'تم حذف الحساب نهائيًا' });
  } catch (error) {
    res.status(500).json({
      message: 'حدث خطأ أثناء حذف الحساب',
      error: error.message,
    });
  }
});

// ✅ التحقق من وجود رقم الهاتف قبل الإرسال
router.post('/check-phone', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'رقم الهاتف مطلوب' });
    }

    const user = await User.findOne({ phone });
    const exists = !!user;

    res.status(200).json({ exists });
  } catch (error) {
    console.error('Check Phone Error:', error);
    res.status(500).json({ message: 'فشل التحقق من رقم الهاتف', error: error.message });
  }
});

// ✅ تحديث رقم الهاتف
router.put('/update-phone', verifyUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { newPhone } = req.body;

    if (!newPhone || typeof newPhone !== 'string') {
      return res.status(400).json({ message: 'رقم الهاتف الجديد مطلوب' });
    }

    const existingUser = await User.findOne({ phone: newPhone });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(409).json({ message: 'رقم الهاتف مستخدم بالفعل' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { phone: newPhone },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.status(200).json({ message: 'تم تحديث رقم الهاتف بنجاح', phone: user.phone });
  } catch (error) {
    res.status(500).json({
      message: 'فشل في تحديث رقم الهاتف',
      error: error.message,
    });
  }
});
// ✅ تحديث FCM Token الخاص بالمستخدم (للإشعارات الذكية)
router.post('/update-fcm-token', verifyUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM Token مطلوب' });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { fcmToken },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    res.status(200).json({ message: 'تم تحديث FCM Token', fcmToken });
  } catch (error) {
    res.status(500).json({ message: 'فشل تحديث FCM Token', error: error.message });
  }
});
// ✅ جلب إعدادات الإشعارات للمستخدم
router.get('/notification-settings', verifyUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

    res.status(200).json({ notificationSettings: user.notificationSettings });
  } catch (error) {
    res.status(500).json({
      message: 'فشل في جلب إعدادات الإشعارات',
      error: error.message,
    });
  }
});
// ✅ تحديث إعدادات الإشعارات للمستخدم
router.put('/notification-settings', verifyUser, async (req, res) => {
  try {
    const { notificationSettings } = req.body;
    if (!notificationSettings) {
      return res.status(400).json({ message: 'notificationSettings مطلوب' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { notificationSettings },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

    res.status(200).json({ message: 'تم تحديث إعدادات الإشعارات بنجاح', notificationSettings: user.notificationSettings });
  } catch (error) {
    res.status(500).json({
      message: 'فشل في تحديث إعدادات الإشعارات',
      error: error.message,
    });
  }
});

module.exports = router;
