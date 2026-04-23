const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const HttpError = require('./httpError');

const buildTransactionId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const ensureWallet = async (userId) => {
  const wallet = await Wallet.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, balance: 0, currency: 'INR' } },
    { new: true, upsert: true }
  );

  return wallet;
};

const createTransaction = async ({ wallet, userId, type, amount, description, source, referenceId = '', referenceType = '', paymentMethod = 'none', bonusAmount = 0, meta = {} }) => {
  return WalletTransaction.create({
    userId,
    walletId: wallet._id,
    type,
    amount,
    balanceAfter: wallet.balance,
    description,
    source,
    referenceId,
    referenceType,
    paymentMethod,
    transactionId: buildTransactionId(type === 'credit' ? 'CR' : 'DR'),
    bonusAmount,
    meta,
  });
};

const creditWallet = async ({ userId, amount, description, source = 'topup', referenceId = '', referenceType = '', paymentMethod = 'none', bonusAmount = 0, meta = {} }) => {
  if (amount <= 0) {
    throw new HttpError(400, 'Amount must be greater than zero.');
  }

  const wallet = await ensureWallet(userId);
  wallet.balance += amount;
  await wallet.save();

  const transaction = await createTransaction({
    wallet,
    userId,
    type: 'credit',
    amount,
    description,
    source,
    referenceId,
    referenceType,
    paymentMethod,
    bonusAmount,
    meta,
  });

  return { wallet, transaction };
};

const debitWallet = async ({ userId, amount, description, source = 'booking', referenceId = '', referenceType = '', paymentMethod = 'wallet', meta = {} }) => {
  if (amount <= 0) {
    throw new HttpError(400, 'Amount must be greater than zero.');
  }

  const wallet = await Wallet.findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );

  if (!wallet) {
    throw new HttpError(400, 'Insufficient wallet balance.');
  }

  const transaction = await createTransaction({
    wallet,
    userId,
    type: 'debit',
    amount,
    description,
    source,
    referenceId,
    referenceType,
    paymentMethod,
    meta,
  });

  return { wallet, transaction };
};

module.exports = {
  ensureWallet,
  creditWallet,
  debitWallet,
};
