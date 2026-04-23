const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ['topup', 'booking', 'refund', 'bonus', 'adjustment'],
      default: 'adjustment',
    },
    referenceId: {
      type: String,
      default: '',
      trim: true,
    },
    referenceType: {
      type: String,
      default: '',
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'wallet', 'none'],
      default: 'none',
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    bonusAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    meta: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

module.exports = WalletTransaction;
