const express = require('express');
const router = express.Router();
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const Product = require('../models/product');
const User = require('../models/user');
const verifyAdmin = require('../middleware/verifyAdmin');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

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

// ✅ إضافة منتج جديد
router.post('/add', upload.array('images', 20), verifyAdmin, async (req, res) => {
  try {
    const { name, gender, category, price, sizes, colors, discount } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'يجب إرفاق صورة واحدة على الأقل' });
    }

    const uploadedImages = [];
    for (const file of req.files) {
      const result = await streamUpload(file.buffer);
      uploadedImages.push(result.secure_url);
    }

    const product = await Product.create({
      name,
      gender,
      category,
      price,
      discount: !isNaN(parseFloat(discount)) ? parseFloat(discount) : 0,
      sizes: sizes ? JSON.parse(sizes) : [],
      colors: colors ? JSON.parse(colors) : [],
      images: uploadedImages,
    });

    res.status(201).json({ message: 'تم إضافة المنتج بنجاح', product });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إضافة المنتج', error: error.message });
  }
});

// ✅ جلب المنتجات مع الفلاتر + discountedPrice
router.get('/', async (req, res) => {
  try {
    const { gender, category, min, max } = req.query;

    let filter = {};
    if (gender) filter.gender = gender;
    if (category) filter.category = category;
    if (min || max) {
      filter.price = {};
      if (min) filter.price.$gte = parseFloat(min);
      if (max) filter.price.$lte = parseFloat(max);
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    const updatedProducts = products.map(product => {
      const discountedPrice = product.price - (product.price * (product.discount || 0) / 100);
      return {
        ...product._doc,
        discountedPrice: Math.round(discountedPrice)
      };
    });

    res.status(200).json(updatedProducts);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب البيانات', error: error.message });
  }
});

// ✅ تعديل منتج
router.put('/edit/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gender, category, price, sizes, colors, discount } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, gender, category, price, sizes, colors, discount },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }

    res.status(200).json({ message: 'تم تعديل المنتج بنجاح', product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تعديل المنتج', error: error.message });
  }
});

// ✅ حذف منتج
router.delete('/delete/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }

    // إزالة المنتج من المفضلات لكل المستخدمين
    await User.updateMany(
      { favorites: id },
      { $pull: { favorites: id } }
    );

    res.status(200).json({ message: 'تم حذف المنتج بنجاح وتمت إزالته من مفضلات المستخدمين' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء حذف المنتج', error: error.message });
  }
});

module.exports = router;
