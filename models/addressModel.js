const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  label: {
    type: String,
    default: 'عنوان بدون اسم'
  }
}, {
  timestamps: true // ينطي createdAt و updatedAt تلقائيًا
});

module.exports = mongoose.model('Address', addressSchema);
