const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const User = require('../models/user');
const Product = require('../models/product');
const verifyAdmin = require('../middleware/verifyAdmin'); // ✅ حماية الأدمن

// ✅ إنشاء الطلب (السيرفر يحسب totalPrice ويوثق السعر داخل كل منتج)
router.post('/create', async (req, res) => {
  try {
    const { userId, products } = req.body;

    if (!userId || !products || products.length === 0) {
      return res.status(400).json({ message: 'البيانات غير مكتملة' });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    let totalPrice = 0;
    const fullProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `المنتج غير موجود: ${item.productId}` });
      }

      const discount = product.discount || 0;
      const priceAfterDiscount = product.price - (product.price * discount / 100);
      const quantity = item.quantity || 1;

      totalPrice += priceAfterDiscount * quantity;

      fullProducts.push({
        productId: item.productId,
        quantity,
        size: item.size,
        color: item.color,
        priceAtOrder: Math.round(priceAfterDiscount)
      });
    }

    const order = await Order.create({
      userId,
      products: fullProducts,
      totalPrice: Math.round(totalPrice)
    });

    res.status(201).json({ message: 'تم إنشاء الطلب بنجاح', order });
  } catch (error) {
    res.status(500).json({ message: 'فشل في إنشاء الطلب', error: error.message });
  }
});

// ✅ عرض جميع الطلبات - للأدمن فقط
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('userId')
      .populate('products.productId')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'فشل في جلب الطلبات', error: error.message });
  }
});

// ✅ عرض الطلبات الخاصة بمستخدم معيّن
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId })
      .populate('products.productId')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'فشل في جلب الطلبات الخاصة بالمستخدم', error: error.message });
  }
});

// ✅ تحديث حالة الطلب - للأدمن فقط
router.put('/update-status/:id', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'حالة الطلب غير صالحة' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    res.status(200).json({ message: 'تم تحديث حالة الطلب بنجاح', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'فشل في تحديث حالة الطلب', error: error.message });
  }
});

// ✅ إلغاء الطلب + الحظر التلقائي الذكي - للأدمن فقط
router.put('/cancel/:orderId', verifyAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    order.status = 'cancelled';
    order.cancelledByAdmin = true;
    await order.save();

    const cancelledCount = await Order.countDocuments({
      userId: order.userId,
      status: 'cancelled',
      cancelledByAdmin: true
    });

    const user = await User.findById(order.userId);

    if (cancelledCount >= 2 && !user.bannedByAdmin) {
      await User.findByIdAndUpdate(order.userId, { isBanned: true });
    }

    res.status(200).json({
      message: 'تم إلغاء الطلب بنجاح',
      banned: cancelledCount >= 2
        ? (user.bannedByAdmin ? '⚠️ الزبون محظور يدويًا مسبقًا' : '🚫 تم حظر الزبون تلقائيًا')
        : '✅ الزبون غير محظور بعد'
    });
  } catch (error) {
    res.status(500).json({ message: 'فشل في إلغاء الطلب', error: error.message });
  }
});

// ✅ عدد الطلبات الملغية لمستخدم معيّن - للأدمن فقط
router.get('/cancelled-count/:userId', verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await Order.countDocuments({
      userId,
      status: 'cancelled',
      cancelledByAdmin: true
    });

    res.status(200).json({ cancelledCount: count });
  } catch (error) {
    res.status(500).json({ message: 'فشل في جلب عدد الطلبات الملغية', error: error.message });
  }
});

module.exports = router;
