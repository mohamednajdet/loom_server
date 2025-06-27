const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'boy', 'girl'], required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  sizes: { type: [String], default: [] },
  colors: { type: [String], default: [] },
  images: {
    type: [String],
    required: true,
    validate: {
      validator: arr => arr.length > 0,
      message: 'يجب رفع صورة واحدة على الأقل للمنتج'
    }
  },
  categoryType: {
    type: String,
    enum: [
      'ملابس طلعة',
      'ملابس بيت',
      'ملابس داخلية',
      'جوارب',
      'احذية وسليبرز',
      'ملابس نوم',
      'جنط'
    ],
    required: true
  },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
