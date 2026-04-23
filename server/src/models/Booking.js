const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    tickets: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    selectedSeats: [
      {
        type: String,
        trim: true,
      },
    ],
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'wallet', 'cash', 'none'],
      default: 'none',
    },
    paymentTransactionId: {
      type: String,
      default: '',
      trim: true,
    },
    paymentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    baseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    convenienceFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentLogs: [
      {
        status: {
          type: String,
          enum: ['pending', 'paid', 'failed'],
          required: true,
        },
        note: {
          type: String,
          default: '',
          trim: true,
        },
        at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    bookingStatus: {
      type: String,
      enum: ['approved', 'cancelled'],
      default: 'approved',
    },
    checkInStatus: {
      type: String,
      enum: ['not_checked_in', 'checked_in'],
      default: 'not_checked_in',
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    qrCode: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
