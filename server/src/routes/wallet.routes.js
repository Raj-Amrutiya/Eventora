const express = require('express');
const { body } = require('express-validator');
const { auth, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const HttpError = require('../utils/httpError');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const { ensureWallet, creditWallet } = require('../utils/wallet');

const router = express.Router();

router.get(
  '/me',
  auth,
  asyncHandler(async (req, res) => {
    const wallet = await ensureWallet(req.user._id);
    const transactions = await WalletTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);

    return res.status(200).json({
      success: true,
      data: {
        wallet,
        transactions,
      },
    });
  })
);

router.post(
  '/top-up',
  auth,
  [
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than zero.'),
    body('paymentMethod').optional().isIn(['upi', 'card', 'netbanking']).withMessage('Invalid payment method.'),
    body('bonusAmount').optional().isFloat({ min: 0 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const amount = Number(req.body.amount);
    const bonusAmount = Number(req.body.bonusAmount || 0);
    const totalAmount = amount + bonusAmount;

    const paymentMethod = req.body.paymentMethod || 'upi';
    const walletResult = await creditWallet({
      userId: req.user._id,
      amount: totalAmount,
      bonusAmount,
      paymentMethod,
      source: bonusAmount > 0 ? 'bonus' : 'topup',
      description:
        bonusAmount > 0
          ? `Wallet top-up of INR ${amount} with INR ${bonusAmount} bonus`
          : `Wallet top-up of INR ${amount}`,
      meta: {
        requestedAmount: amount,
        bonusAmount,
        paymentMethod,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Wallet funded successfully.',
      data: walletResult,
    });
  })
);

router.get(
  '/admin/transactions',
  auth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const transactions = await WalletTransaction.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  })
);

router.post(
  '/admin/:walletId/adjust',
  auth,
  requireAdmin,
  [
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than zero.'),
    body('type').isIn(['credit', 'debit']).withMessage('Type must be credit or debit.'),
    body('reason').isLength({ min: 3 }).withMessage('Reason is required.'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const wallet = await Wallet.findById(req.params.walletId);
    if (!wallet) {
      throw new HttpError(404, 'Wallet not found.');
    }

    const amount = Number(req.body.amount);
    if (req.body.type === 'debit' && wallet.balance < amount) {
      throw new HttpError(400, 'Insufficient balance for debit adjustment.');
    }

    wallet.balance = req.body.type === 'credit' ? wallet.balance + amount : wallet.balance - amount;
    await wallet.save();

    await WalletTransaction.create({
      userId: wallet.userId,
      walletId: wallet._id,
      type: req.body.type,
      amount,
      balanceAfter: wallet.balance,
      description: req.body.reason,
      source: 'adjustment',
      referenceId: '',
      referenceType: 'admin_adjustment',
      paymentMethod: 'none',
      transactionId: `ADJ-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      meta: {
        reason: req.body.reason,
        adminId: req.user._id.toString(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Wallet updated successfully.',
      data: wallet,
    });
  })
);

module.exports = router;
