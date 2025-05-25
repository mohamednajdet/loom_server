const express = require('express');
const router = express.Router();
const cart = require('../models/cart');

// ✅ إضافة منتج إلى السلة
router.post('/add', async (req, res) => {
  try {
    const { userId, productId, quantity, size, color } = req.body;

    if (!userId || !productId || !size || !color) {
      return res.status(400).json({
        message: 'يرجى تعبئة جميع الحقول المطلوبة لإضافة المنتج إلى السلة',
      });
    }

    let userCart = await cart.findOne({ userId });

    if (!userCart) {
      userCart = new cart({
        userId,
        items: [{ productId, quantity, size, color }],
      });
    } else {
      const existingItem = userCart.items.find(
        (item) =>
          item.productId.toString() === productId &&
          item.size === size &&
          item.color === color
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        userCart.items.push({ productId, quantity, size, color });
      }
    }

    await userCart.save();
    res.status(200).json({
      message: 'تمت إضافة المنتج إلى السلة بنجاح',
      cart: userCart,
    });
  } catch (error) {
    res.status(500).json({
      message: 'فشل في إضافة المنتج إلى السلة',
      error: error.message,
    });
  }
});

// ✅ عرض محتويات السلة
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const userCart = await cart
      .findOne({ userId })
      .populate('items.productId');

    if (!userCart || userCart.items.length === 0) {
      return res.status(404).json({
        message: 'السلة فارغة أو غير موجودة',
      });
    }

    res.status(200).json(userCart);
  } catch (error) {
    res.status(500).json({
      message: 'فشل في جلب السلة',
      error: error.message,
    });
  }
});

// ✅ حذف منتج من السلة
router.delete('/remove', async (req, res) => {
  try {
    const { userId, productId, size, color } = req.body;

    if (!userId || !productId || !size || !color) {
      return res.status(400).json({
        message: 'يرجى تحديد المنتج المطلوب حذفه بدقة',
      });
    }

    const userCart = await cart.findOne({ userId });
    if (!userCart) {
      return res.status(404).json({
        message: 'السلة غير موجودة',
      });
    }

    const initialLength = userCart.items.length;

    userCart.items = userCart.items.filter(
      (item) =>
        !(
          item.productId.toString() === productId &&
          item.size === size &&
          item.color === color
        )
    );

    if (userCart.items.length === initialLength) {
      return res.status(404).json({
        message: 'لم يتم العثور على العنصر المطلوب حذفه من السلة',
      });
    }

    await userCart.save();
    res.status(200).json({
      message: 'تم حذف المنتج من السلة بنجاح',
      cart: userCart,
    });
  } catch (error) {
    res.status(500).json({
      message: 'فشل في حذف المنتج من السلة',
      error: error.message,
    });
  }
});

module.exports = router;
