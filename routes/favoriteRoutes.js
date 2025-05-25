const express = require('express');
const router = express.Router();
const User = require('../models/user');

// ✅ إضافة منتج إلى المفضلة
router.post('/add', async (req, res) => {
  const { userId, productId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

    if (user.favorites.includes(productId)) {
      return res.status(400).json({ message: 'المنتج موجود مسبقًا في المفضلة' });
    }

    user.favorites.push(productId);
    await user.save();
    res.status(200).json({ message: 'تمت إضافة المنتج إلى المفضلة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'فشل في إضافة المنتج إلى المفضلة', error: error.message });
  }
});

// ✅ إزالة منتج من المفضلة
router.post('/remove', async (req, res) => {
  const { userId, productId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

    user.favorites = user.favorites.filter(
      (favId) => favId.toString() !== productId
    );

    await user.save();
    res.status(200).json({ message: 'تمت إزالة المنتج من المفضلة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'فشل في إزالة المنتج من المفضلة', error: error.message });
  }
});

// ✅ جلب قائمة المفضلة
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('favorites');
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

    res.status(200).json({ favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ message: 'فشل في جلب قائمة المفضلة', error: error.message });
  }
});

module.exports = router;
