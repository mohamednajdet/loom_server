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
    const { name, gender, type, price, sizes, colors, discount, categoryType } = req.body;

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
      type,
      price,
      discount: !isNaN(parseFloat(discount)) ? parseFloat(discount) : 0,
      sizes: sizes ? JSON.parse(sizes) : [],
      colors: colors ? JSON.parse(colors) : [],
      images: uploadedImages,
      categoryType // << تمت إضافتها هنا!
    });

    res.status(201).json({ message: 'تم إضافة المنتج بنجاح', product });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إضافة المنتج', error: error.message });
  }
});

const parseArray = (param) => {
  if (!param) return undefined;
  if (Array.isArray(param)) return param;
  if (typeof param === 'string') return param.split(',');
  return undefined;
};

// ✅ بحث مع فلاتر
router.get('/search', async (req, res) => {
  try {
    const { q, types, genders, sizes, min, max, categoryType } = req.query;

    let filter = {};

    if (q && q.trim() !== '') {
      const regex = new RegExp(q, 'i');
      filter.$or = [{ name: regex }, { type: regex }];
    }

    const genderArray = parseArray(genders);
    const typeArray = parseArray(types);
    const sizeArray = parseArray(sizes);
    const categoryTypeArray = parseArray(categoryType);

    if (genderArray) filter.gender = { $in: genderArray };
    if (typeArray) filter.type = { $in: typeArray };
    if (sizeArray) filter.sizes = { $in: sizeArray };
    if (categoryTypeArray) filter.categoryType = { $in: categoryTypeArray };

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
    res.status(500).json({ message: 'فشل البحث عن المنتجات', error: error.message });
  }
});

// ✅ جلب الكل مع فلاتر
router.get('/', async (req, res) => {
  try {
    const { gender, type, size, min, max, categoryType } = req.query;

    let filter = {};

    const genderArray = parseArray(gender);
    const typeArray = parseArray(type);
    const sizeArray = parseArray(size);
    const categoryTypeArray = parseArray(categoryType);

    if (genderArray) filter.gender = { $in: genderArray };
    if (typeArray) filter.type = { $in: typeArray };
    if (sizeArray) filter.sizes = { $in: sizeArray };
    if (categoryTypeArray) filter.categoryType = { $in: categoryTypeArray };

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

// ✅ جلب منتج حسب ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }

    const discountedPrice = product.price - (product.price * (product.discount || 0) / 100);
    res.status(200).json({ ...product._doc, discountedPrice: Math.round(discountedPrice) });
  } catch (error) {
    res.status(500).json({ message: 'فشل في جلب المنتج', error: error.message });
  }
});

// ✅ تعديل منتج
router.put('/edit/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gender, type, price, sizes, colors, discount, categoryType } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, gender, type, price, sizes, colors, discount, categoryType },
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

    await User.updateMany({ favorites: id }, { $pull: { favorites: id } });

    res.status(200).json({ message: 'تم حذف المنتج بنجاح وتمت إزالته من مفضلات المستخدمين' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء حذف المنتج', error: error.message });
  }
});

module.exports = router;
