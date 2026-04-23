const mongoose = require('mongoose');

const previousEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    poster: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    attendedStudents: {
      type: Number,
      required: true,
      min: 0,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    bannerLine: {
      type: String,
      required: true,
      trim: true,
      maxlength: 320,
    },
  },
  { timestamps: true }
);

const PreviousEvent = mongoose.model('PreviousEvent', previousEventSchema);

module.exports = PreviousEvent;
