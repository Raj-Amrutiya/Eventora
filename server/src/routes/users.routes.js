const express = require('express');
const { param, body } = require('express-validator');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { auth, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const HttpError = require('../utils/httpError');
const logActivity = require('../utils/activityLogger');

const router = express.Router();

router.get(
  '/profile',
  auth,
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ userId: req.user._id }).populate('eventId', 'title date venue');

    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
        eventHistory: bookings,
      },
    });
  })
);

router.patch(
  '/profile',
  auth,
  [
    body('name').optional().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
    body('email').optional().isEmail().withMessage('Valid email is required.'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const updates = {};

    if (typeof req.body.name === 'string') {
      updates.name = req.body.name.trim();
    }

    if (typeof req.body.email === 'string') {
      updates.email = req.body.email.trim().toLowerCase();
      const existing = await User.findOne({ email: updates.email, _id: { $ne: req.user._id } });
      if (existing) {
        throw new HttpError(409, 'Email is already in use by another account.');
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new HttpError(400, 'No profile fields were provided for update.');
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedUser,
    });
  })
);

router.get(
  '/admin',
  auth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: users,
    });
  })
);

router.patch(
  '/admin/:id/block',
  auth,
  requireAdmin,
  [
    param('id').isMongoId().withMessage('Invalid user id.'),
    body('isBlocked').isBoolean().withMessage('isBlocked must be true or false.'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new HttpError(404, 'User not found.');
    }

    if (user.role === 'admin') {
      throw new HttpError(400, 'Admin account cannot be blocked.');
    }

    user.isBlocked = req.body.isBlocked;
    await user.save();

    await logActivity(req, {
      actionType: 'user_block_updated',
      actorUserId: req.user._id,
      actorEmail: req.user.email,
      targetEntity: 'user',
      targetId: user._id.toString(),
      details: {
        isBlocked: user.isBlocked,
        targetUserEmail: user.email,
      },
    });

    return res.status(200).json({
      success: true,
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully.`,
    });
  })
);

module.exports = router;
