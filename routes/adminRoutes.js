const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Order = require('../models/order');
const verifyAdmin = require('../middleware/verifyAdmin');

// ✅ تسجيل دخول الأدمن
router.post('/login', async (req, res) => {
  const { phone } = req.body;
  try {
    const admin = await User.findOne({ phone });

    if (!admin || admin.role !== 'admin') {
      return res.status(401).json({ message: 'رقم الهاتف غير مسجل كأدمن' });
    }

    const token = jwt.sign(
      {
        userId: admin._id,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({
      message: 'تم تسجيل الدخول كأدمن بنجاح',
      admin,
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: 'فشل في تسجيل دخول الأدمن',
      error: error.message,
    });
  }
});

// ✅ ملخص عن المستخدم من خلال رقم الهاتف - للأدمن فقط
router.get('/user-summary', verifyAdmin, async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ message: 'يرجى إدخال رقم الهاتف' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const totalOrders = await Order.countDocuments({ userId: user._id });
    const deliveredOrders = await Order.countDocuments({
      userId: user._id,
      status: 'delivered',
    });
    const cancelledOrders = await Order.countDocuments({
      userId: user._id,
      status: 'cancelled',
      cancelledByAdmin: true,
    });

    const recentOrders = await Order.find({ userId: user._id })
      .populate('products.productId')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      message: 'تم جلب تقرير المستخدم بنجاح',
      userInfo: {
        id: user._id,
        phone: user.phone,
        gender: user.gender,
        isBanned: user.isBanned,
        bannedByAdmin: user.bannedByAdmin,
        createdAt: user.createdAt,
      },
      orderStats: {
        totalOrders,
        deliveredOrders,
        cancelledOrders,
      },
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({
      message: 'فشل في جلب تقرير المستخدم',
      error: error.message,
    });
  }
});

// ✅ حظر أو إلغاء حظر مستخدم يدويًا - للأدمن فقط
router.put('/ban-user/:userId', verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { ban } = req.body;

    if (typeof ban !== 'boolean') {
      return res.status(400).json({ message: 'قيمة الحظر يجب أن تكون true أو false' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: ban, bannedByAdmin: ban },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.status(200).json({
      message: ban ? '🚫 تم حظر المستخدم من قبل الأدمن' : '✅ تم رفع الحظر عن المستخدم',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'فشل في تحديث حالة الحظر', error: error.message });
  }
});

module.exports = router;
