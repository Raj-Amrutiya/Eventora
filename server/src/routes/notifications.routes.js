const express = require('express');
const { auth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const Notification = require('../models/Notification');

const router = express.Router();

router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipientUserId: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  })
);

module.exports = router;