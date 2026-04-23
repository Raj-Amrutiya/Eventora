const ActivityLog = require('../models/ActivityLog');

const getIpAddress = (req) => req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';

const logActivity = async (req, payload) => {
  try {
    await ActivityLog.create({
      actionType: payload.actionType,
      actorUserId: payload.actorUserId || null,
      actorEmail: payload.actorEmail || '',
      targetEntity: payload.targetEntity || 'system',
      targetId: payload.targetId || '',
      details: payload.details || {},
      ipAddress: req ? String(getIpAddress(req)) : '',
      userAgent: req?.headers['user-agent'] || '',
    });
  } catch (error) {
    // Keep request flow safe if logging fails.
    // eslint-disable-next-line no-console
    console.error('Activity logging failed:', error.message);
  }
};

module.exports = logActivity;
