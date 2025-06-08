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
    enum: ['user', 'admin'], // نحدد نوع الدور
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
