const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const User = require('../models/user');
const Product = require('../models/product');
const verifyAdmin = require('../middleware/verifyAdmin');
const admin = require('firebase-admin'); // لإرسال الإشعارات

// ✅ إنشاء الطلب مع إشعار تلقائي
router.post('/create', async (req, res) => {
  try {
    const { userId, products, address } = req.body;

    if (!userId || !products || products.length === 0 || !address) {
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
      address,
      totalPrice: Math.round(totalPrice)
    });

    // 🟡 إشعار تلقائي عند إنشاء الطلب (إذا مفعل إشعارات حالة الطلب)
    if (
      userExists.fcmToken &&
      (!userExists.notificationSettings || userExists.notificationSettings.orderStatus !== false)
    ) {
      await admin.messaging().send({
        token: userExists.fcmToken,
        notification: {
          title: 'تم استلام طلبك! 🎉',
          body: 'طلبك وصلنه، ونباشر بتحضيره بأقرب وقت.',
        },
        data: { type: 'order_created' }
      });
    }

    res.status(201).json({ message: 'تم إنشاء الطلب بنجاح', order });
  } catch (error) {
    res.status(500).json({ message: 'فشل في إنشاء الطلب', error: error.message });
  }
});

// ✅ تحديث حالة الطلب + إشعار
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
    ).populate('userId');

    if (!updatedOrder) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    // 🟡 إشعار عند تحديث الحالة (إذا مفعل إشعارات حالة الطلب)
    if (
      updatedOrder.userId?.fcmToken &&
      (!updatedOrder.userId.notificationSettings || updatedOrder.userId.notificationSettings.orderStatus !== false)
    ) {
      let statusMessage = {
        shipped: 'طلبك طلع للتوصيل 🚚',
        delivered: 'طلبك وصل بخير وسلامة 🎁',
        pending: 'طلبك قيد المراجعة ⏳',
        cancelled: 'طلبك انلغى، نعتذر 😔',
      };

      await admin.messaging().send({
        token: updatedOrder.userId.fcmToken,
        notification: {
          title: 'تحديث حالة الطلب',
          body: statusMessage[status] || 'تم تحديث طلبك',
        },
        data: { type: 'order_status', status }
      });
    }

    res.status(200).json({ message: 'تم تحديث حالة الطلب بنجاح', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'فشل في تحديث حالة الطلب', error: error.message });
  }
});

// ✅ إلغاء الطلب + إشعار
router.put('/cancel/:orderId', verifyAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'الطلب غير موجود' });

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

    // 🟡 إشعار عند إلغاء الطلب (إذا مفعل إشعارات حالة الطلب)
    if (
      user?.fcmToken &&
      (!user.notificationSettings || user.notificationSettings.orderStatus !== false)
    ) {
      await admin.messaging().send({
        token: user.fcmToken,
        notification: {
          title: 'طلبك انلغى ❌',
          body: 'نعتذر، تم إلغاء الطلب من قبل الإدارة.',
        },
        data: { type: 'order_cancelled' }
      });
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

module.exports = router;
