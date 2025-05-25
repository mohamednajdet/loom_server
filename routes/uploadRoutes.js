const express = require('express');
const router = express.Router();
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const verifyAdmin = require('../middleware/verifyAdmin');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ رفع صورة واحدة
router.post('/image', upload.single('image'), verifyAdmin, async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'يُرجى إرفاق صورة' });
    }

    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'loom-products' },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req.file.buffer);
    res.status(200).json({
      message: 'تم رفع الصورة بنجاح',
      imageUrl: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء رفع الصورة', error: error.message });
  }
});

module.exports = router;
