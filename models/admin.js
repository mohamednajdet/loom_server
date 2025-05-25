const mongoose = require('mongoose');
const adminSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
