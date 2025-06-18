const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    q1: String,
    q2: String,
    q3: String,
    q4: String,
    notes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Survey', surveySchema);
