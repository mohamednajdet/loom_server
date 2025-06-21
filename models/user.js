const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  bannedByAdmin: {
    type: Boolean,
    default: false,
  },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  ],
  // ✅ إضافة حقل fcmToken لتخزين توكن الإشعارات
  fcmToken: {
    type: String,
    default: null,
  },
  // ✅ إعدادات الإشعارات بشكل كائن
  notificationSettings: {
    orderStatus: { type: Boolean, default: true },
    deals:      { type: Boolean, default: true },
    general:    { type: Boolean, default: true },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
