const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // يخزن createdAt و updatedAt تلقائيًا
  }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
