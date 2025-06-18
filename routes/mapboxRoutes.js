const express = require('express');
const router = express.Router();
const { forwardGeocode } = require('../utils/mapbox');

// ✅ راوت لتحويل عنوان إلى إحداثيات
router.post('/geocode', async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ message: 'يرجى إرسال العنوان ضمن الحقل address' });
  }

  try {
    const location = await forwardGeocode(address);

    if (!location) {
      return res.status(404).json({ message: 'لم يتم العثور على إحداثيات لهذا العنوان' });
    }

    res.json({ location });
  } catch (error) {
    console.error('Mapbox Error:', error.message);
    return res.status(500).json({ message: 'خطأ أثناء الاتصال بخدمة الخريطة' });
  }
});

module.exports = router;
