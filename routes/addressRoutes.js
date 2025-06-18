const express = require('express');
const router = express.Router();
const Address = require('../models/addressModel');
const { verifyUser } = require('../middleware/authMiddleware');

// ✅ إضافة عنوان جديد
router.post('/add', verifyUser, async (req, res) => {
  try {
    const { latitude, longitude, label } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'خطأ: يرجى تحديد الموقع بدقة.' });
    }

    const address = new Address({
      user: req.userId,
      coordinates: { lat: latitude, lng: longitude },
      label
    });

    await address.save();

    res.status(201).json({
      message: '✅ العنوان تم حفظه بنجاح',
      address
    });

  } catch (error) {
    console.error('❌ خطأ في إضافة العنوان:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إضافة العنوان.' });
  }
});

// ✅ جلب العناوين الخاصة بالمستخدم
router.get('/my-addresses', verifyUser, async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .select('label coordinates createdAt');

    res.json(addresses);

  } catch (error) {
    console.error('❌ خطأ في جلب العناوين:', error);
    res.status(500).json({ message: 'فشل في تحميل العناوين.' });
  }
});

// ✅ حذف عنوان
router.delete('/:id', verifyUser, async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!address) {
      return res.status(404).json({ message: 'العنوان غير موجود أو ليس لديك صلاحية الحذف.' });
    }

    res.json({ message: '✅ تم حذف العنوان بنجاح' });

  } catch (error) {
    console.error('❌ خطأ في حذف العنوان:', error);
    res.status(500).json({ message: 'فشل في حذف العنوان.' });
  }
});

// ✅ تعديل اسم العنوان والموقع
router.put('/:id', verifyUser, async (req, res) => {
  try {
    const { label, latitude, longitude } = req.body;

    const updatedFields = {};
    if (label) updatedFields.label = label;
    if (latitude && longitude) {
      updatedFields.coordinates = { lat: latitude, lng: longitude };
    }

    const updated = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: updatedFields },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'العنوان غير موجود أو ليس لديك صلاحية التعديل.' });
    }

    res.json({
      message: '✅ تم تعديل العنوان بنجاح',
      address: updated
    });

  } catch (error) {
    console.error('❌ خطأ في تعديل العنوان:', error);
    res.status(500).json({ message: 'فشل في تعديل العنوان.' });
  }
});

module.exports = router;
