const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// ✅ إنشاء حساب جديد
router.post('/register', async (req, res) => {
  try {
    const { name, phone, gender } = req.body;
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(400).json({ message: 'المستخدم مسجل من قبل' });
    }

    const newUser = new User({ name, phone, gender });
    await newUser.save();

    res.status(201).json({ message: 'تم إنشاء المستخدم بنجاح ✅', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقًا', error: error.message });
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
        whatsappLink: 'https://wa.me/9647856863932'
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({
      message: 'تم تسجيل الدخول بنجاح',
      user,
      role: user.isAdmin ? 'admin' : 'user',
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الدخول', error: error.message });
  }
});

// ✅ جلب كل المستخدمين
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'فشل في جلب المستخدمين', error: error.message });
  }
});

// ✅ تعديل المفضلة (إضافة أو حذف)
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
    res.status(500).json({ message: 'حدث خطأ أثناء تعديل المفضلة', error: error.message });
  }
});

// ✅ جلب المفضلة
router.get('/favorites/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('favorites');
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

    res.status(200).json({ favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب المفضلة', error: error.message });
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
    res.status(500).json({ message: 'حدث خطأ أثناء حذف المنتج من المفضلة', error: error.message });
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
    res.status(500).json({ message: 'حدث خطأ أثناء حذف الحساب', error: error.message });
  }
});

module.exports = router;
