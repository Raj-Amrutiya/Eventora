const express = require('express');
const { query } = require('express-validator');
const ActivityLog = require('../models/ActivityLog');
const { auth, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');

const router = express.Router();

router.get(
  '/admin',
  auth,
  requireAdmin,
  [
    query('actionType').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 500 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const filters = {};
    if (req.query.actionType) {
      filters.actionType = req.query.actionType;
    }

    const limit = Number(req.query.limit || 100);

    const logs = await ActivityLog.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('actorUserId', 'name email role');

    return res.status(200).json({
      success: true,
      data: logs,
    });
  })
);

module.exports = router;
