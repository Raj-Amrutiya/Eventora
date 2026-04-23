const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      required: true,
      enum: [
        'signup',
        'login_success',
        'login_failed',
        'event_created',
        'event_updated',
        'event_deleted',
        'booking_created',
        'booking_status_updated',
        'booking_check_in_updated',
        'payment_status_updated',
        'user_block_updated',
        'contact_submitted',
      ],
    },
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    targetEntity: {
      type: String,
      enum: ['user', 'event', 'booking', 'contact', 'system'],
      default: 'system',
    },
    targetId: {
      type: String,
      default: '',
      trim: true,
    },
    ipAddress: {
      type: String,
      default: '',
      trim: true,
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ actionType: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
