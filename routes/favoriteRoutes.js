const express = require('express');
const router = express.Router();
const { verifyUser } = require('../middleware/authMiddleware');
const User = require('../models/user');

// ✅ إضافة منتج إلى المفضلة
router.post('/add', verifyUser, async (req, res) => {
  const { productId } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

    if (user.favorites.includes(productId)) {
      return res.status(400).json({ message: 'المنتج موجود مسبقًا في المفضلة' });
    }

    user.favorites.push(productId);
    await user.save();

    res.status(200).json({ message: 'تمت إضافة المنتج إلى المفضلة بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'فشل في إضافة المنتج إلى المفضلة', error: err.message });
  }
});

// ✅ إزالة منتج من المفضلة (بالـ DELETE و param)
router.delete('/remove/:productId', verifyUser, async (req, res) => {
  const { productId } = req.params;
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

    user.favorites = user.favorites.filter(fav => fav.toString() !== productId);
    await user.save();

    res.status(200).json({ message: 'تمت إزالة المنتج من المفضلة بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'فشل في إزالة المنتج من المفضلة', error: err.message });
  }
});

// ✅ جلب قائمة المفضلة مع discountedPrice
router.get('/', verifyUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('favorites');
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

    // معالجة السعر المخفض
    const favoritesWithDiscount = user.favorites.map(prod => {
      const price = prod.price || 0;
      const discount = prod.discount || 0;
      const discountedPrice = Math.round(price - (price * discount / 100));
      return {
        ...prod._doc,
        discountedPrice,
      };
    });

    res.status(200).json({ favorites: favoritesWithDiscount });
  } catch (err) {
    res.status(500).json({ message: 'فشل في جلب قائمة المفضلة', error: err.message });
  }
});

module.exports = router;
