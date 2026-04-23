const express = require('express');
const { body, query, param } = require('express-validator');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const HttpError = require('../utils/httpError');
const logActivity = require('../utils/activityLogger');
const sendEmail = require('../utils/mailer');
const { eventAnnouncementTemplate } = require('../utils/emailTemplates');

const router = express.Router();

router.get(
  '/',
  [
    query('category').optional().isString(),
    query('type').optional().isIn(['free', 'paid']),
    query('search').optional().isString(),
    query('featured').optional().isIn(['true', 'false']),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { category, type, search, date, featured } = req.query;
    const filters = {};

    if (category) filters.category = category;
    if (date) filters.date = date;
    if (typeof featured === 'string') filters.featured = featured === 'true';
    if (type === 'free') filters.price = 0;
    if (type === 'paid') filters.price = { $gt: 0 };
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { organizer: { $regex: search, $options: 'i' } },
      ];
    }

    const events = await Event.find(filters).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: events,
    });
  })
);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid event id.')],
  validate,
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) {
      throw new HttpError(404, 'Event not found.');
    }

    return res.status(200).json({
      success: true,
      data: event,
    });
  })
);

router.post(
  '/',
  auth,
  requireAdmin,
  [
    body('title').isLength({ min: 3 }),
    body('description').isLength({ min: 20 }),
    body('category').isIn(['Cultural', 'Technical', 'Sports', 'Workshop', 'Academic', 'Mega']),
    body('date').notEmpty(),
    body('time').notEmpty(),
    body('venue').notEmpty(),
    body('organizer').notEmpty(),
    body('seats').isInt({ min: 1 }),
    body('price').isFloat({ min: 0 }),
    body('image').isURL(),
    body('featured').optional().isBoolean(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const event = await Event.create(req.body);
    const registeredUsers = await User.find({}, '_id email name');

    if (registeredUsers.length > 0) {
      const notifications = registeredUsers.map((user) => ({
        recipientUserId: user._id,
        recipientEmail: user.email,
        type: 'event_created',
        title: `New event added: ${event.title}`,
        message: `${event.title} is now live on Eventora. Register before seats run out.`,
        metadata: {
          eventId: event._id.toString(),
          eventTitle: event.title,
          date: event.date,
          time: event.time,
          venue: event.venue,
          organizer: event.organizer,
          price: event.price,
          category: event.category,
          poster: event.image,
        },
        status: 'queued',
      }));

      await Notification.insertMany(notifications);

      const announcementMail = eventAnnouncementTemplate({
        eventTitle: event.title,
        category: event.category,
        date: event.date,
        time: event.time,
        venue: event.venue,
        organizer: event.organizer,
        price: event.price,
      });

      await Promise.allSettled(
        registeredUsers.map((user) =>
          sendEmail({
            to: user.email,
            subject: announcementMail.subject,
            html: announcementMail.html,
          })
        )
      );

      await Notification.updateMany(
        { 'metadata.eventId': event._id.toString() },
        {
          $set: {
            status: 'sent',
            sentAt: new Date(),
          },
        }
      );
    }

    await logActivity(req, {
      actionType: 'event_created',
      actorUserId: req.user._id,
      actorEmail: req.user.email,
      targetEntity: 'event',
      targetId: event._id.toString(),
      details: {
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue,
        poster: event.image,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      data: event,
    });
  })
);

router.put(
  '/:id',
  auth,
  requireAdmin,
  [param('id').isMongoId().withMessage('Invalid event id.')],
  validate,
  asyncHandler(async (req, res) => {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      throw new HttpError(404, 'Event not found.');
    }

    await logActivity(req, {
      actionType: 'event_updated',
      actorUserId: req.user._id,
      actorEmail: req.user.email,
      targetEntity: 'event',
      targetId: event._id.toString(),
      details: {
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue,
        poster: event.image,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      data: event,
    });
  })
);

router.delete(
  '/:id',
  auth,
  requireAdmin,
  [param('id').isMongoId().withMessage('Invalid event id.')],
  validate,
  asyncHandler(async (req, res) => {
    const bookingCount = await Booking.countDocuments({ eventId: req.params.id });
    if (bookingCount > 0) {
      throw new HttpError(400, 'Cannot delete event with bookings.');
    }

    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      throw new HttpError(404, 'Event not found.');
    }

    await logActivity(req, {
      actionType: 'event_deleted',
      actorUserId: req.user._id,
      actorEmail: req.user.email,
      targetEntity: 'event',
      targetId: req.params.id,
      details: {
        title: event.title,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully.',
    });
  })
);

module.exports = router;
