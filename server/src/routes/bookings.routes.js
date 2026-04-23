const express = require('express');
const { body, param } = require('express-validator');
const QRCode = require('qrcode');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const { auth, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const HttpError = require('../utils/httpError');
const logActivity = require('../utils/activityLogger');
const sendEmail = require('../utils/mailer');
const { bookingTemplate } = require('../utils/emailTemplates');
const { generateTicketPdfBuffer, dataUrlToBuffer } = require('../utils/ticketPdf');
const { debitWallet, creditWallet } = require('../utils/wallet');

const router = express.Router();

const coupons = {
  FEST10: { type: 'percent', value: 10, maxDiscount: 300 },
  STUDENT50: { type: 'flat', value: 50 },
};

const generateBookingReference = () => `BMS-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const getPricing = ({ unitPrice, tickets, couponCode }) => {
  const baseAmount = unitPrice * tickets;
  const convenienceFee = Math.round(baseAmount * 0.04);
  const gstAmount = Math.round((baseAmount + convenienceFee) * 0.18);
  const bulkBookingDiscount = tickets > 5 ? 200 : 0;

  const coupon = couponCode ? coupons[couponCode] : null;
  let discountAmount = 0;

  if (coupon?.type === 'percent') {
    discountAmount = Math.round(((baseAmount + convenienceFee + gstAmount) * coupon.value) / 100);
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  }

  if (coupon?.type === 'flat') {
    discountAmount = coupon.value;
  }

  discountAmount += bulkBookingDiscount;

  const totalAmount = Math.max(0, baseAmount + convenienceFee + gstAmount - discountAmount);

  return {
    baseAmount,
    convenienceFee,
    gstAmount,
    bulkBookingDiscount,
    discountAmount,
    totalAmount,
  };
};

router.post(
  '/',
  auth,
  [
    body('eventId').isMongoId().withMessage('Valid event id is required.'),
    body('tickets').isInt({ min: 1, max: 10 }).withMessage('Tickets must be between 1 and 10.'),
    body('selectedSeats').isArray({ min: 1, max: 10 }).withMessage('Please select seats.'),
    body('paymentStatus').optional().isIn(['pending', 'paid', 'failed']),
    body('paymentMethod').optional().isIn(['upi', 'card', 'netbanking', 'wallet', 'cash', 'none']),
    body('paymentTransactionId').optional().isString(),
    body('couponCode').optional().isString(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { eventId, tickets, selectedSeats, paymentStatus, paymentMethod, paymentTransactionId, couponCode } = req.body;
    const event = await Event.findById(eventId);

    if (!event) {
      throw new HttpError(404, 'Event not found.');
    }

    const seatsAvailable = event.seats - event.seatsBooked;
    if (tickets > seatsAvailable) {
      throw new HttpError(400, `Only ${seatsAvailable} seats are available.`);
    }

    if (!selectedSeats || selectedSeats.length !== Number(tickets)) {
      throw new HttpError(400, 'Number of selected seats must match number of tickets.');
    }

    const uniqueSeats = Array.from(new Set(selectedSeats.map((seat) => String(seat).trim().toUpperCase())));
    if (uniqueSeats.length !== Number(tickets)) {
      throw new HttpError(400, 'Duplicate seats selected. Please choose unique seats.');
    }

    const occupiedForEvent = await Booking.find({
      eventId,
      bookingStatus: 'approved',
    }).select('selectedSeats');

    const occupiedSeatSet = new Set(
      occupiedForEvent.flatMap((booking) => (booking.selectedSeats || []).map((seat) => String(seat).toUpperCase()))
    );

    const blockedSeats = uniqueSeats.filter((seat) => occupiedSeatSet.has(seat));
    if (blockedSeats.length > 0) {
      throw new HttpError(409, `Seats already booked: ${blockedSeats.join(', ')}`);
    }

    const normalizedPaymentMethod = event.price > 0 ? paymentMethod || 'upi' : 'none';
    const normalizedPaymentStatus = paymentStatus || (event.price > 0 ? 'paid' : 'pending');
    const normalizedCoupon = (couponCode || '').trim().toUpperCase();
    const pricing = getPricing({
      unitPrice: event.price,
      tickets: Number(tickets),
      couponCode: normalizedCoupon,
    });

    const bookingReference = generateBookingReference();
    const isWalletPayment = event.price > 0 && normalizedPaymentMethod === 'wallet';
    const initialQrPayload = JSON.stringify({
      bookingReference,
      eventId: event._id.toString(),
      event: event.title,
      userId: req.user._id.toString(),
      user: req.user.email,
      tickets,
      seats: uniqueSeats,
      ticketPdfUrl: 'pending',
      generatedAt: new Date().toISOString(),
    });
    const initialQrCode = await QRCode.toDataURL(initialQrPayload);

    let walletDebitResult = null;
    let booking;
    let populated;
    let seatsUpdated = false;

    try {
      if (isWalletPayment && pricing.totalAmount > 0) {
        walletDebitResult = await debitWallet({
          userId: req.user._id,
          amount: pricing.totalAmount,
          description: `Payment for ${event.title} booking`,
          source: 'booking',
          referenceId: bookingReference,
          referenceType: 'booking',
          paymentMethod: 'wallet',
          meta: {
            eventId: event._id.toString(),
            eventTitle: event.title,
            bookingReference,
          },
        });
      }

      booking = await Booking.create({
        userId: req.user._id,
        eventId: event._id,
        tickets,
        selectedSeats: uniqueSeats,
        bookingReference,
        paymentStatus: isWalletPayment ? 'paid' : normalizedPaymentStatus,
        paymentMethod: isWalletPayment ? 'wallet' : normalizedPaymentMethod,
        paymentTransactionId: isWalletPayment ? walletDebitResult.transaction.transactionId : paymentTransactionId || '',
        paymentAmount: pricing.totalAmount,
        baseAmount: pricing.baseAmount,
        convenienceFee: pricing.convenienceFee,
        gstAmount: pricing.gstAmount,
        discountAmount: pricing.discountAmount,
        couponCode: normalizedCoupon,
        paidAt: (isWalletPayment || normalizedPaymentStatus === 'paid') ? new Date() : null,
        paymentLogs: [
          {
            status: isWalletPayment ? 'paid' : normalizedPaymentStatus,
            note: `Initial booking payment status${isWalletPayment ? ' via wallet' : ''}${normalizedCoupon ? ` with coupon ${normalizedCoupon}` : ''}`,
          },
        ],
        qrCode: initialQrCode,
      });
    } catch (bookingError) {
      if (walletDebitResult?.transaction) {
        await creditWallet({
          userId: req.user._id,
          amount: pricing.totalAmount,
          description: `Reversal for failed booking ${bookingReference}`,
          source: 'refund',
          referenceId: bookingReference,
          referenceType: 'booking',
          paymentMethod: 'wallet',
          meta: {
            eventId: event._id.toString(),
            eventTitle: event.title,
            bookingReference,
            reason: 'booking_creation_failed',
          },
        }).catch(() => null);
      }

      throw bookingError;
    }

    try {
      const ticketPdfUrl = `${req.protocol}://${req.get('host')}/api/bookings/${booking._id}/ticket-pdf`;
      const qrPayload = JSON.stringify({
        bookingId: booking._id.toString(),
        bookingReference,
        eventId: event._id.toString(),
        event: event.title,
        userId: req.user._id.toString(),
        user: req.user.email,
        tickets,
        seats: uniqueSeats,
        ticketPdfUrl,
        generatedAt: new Date().toISOString(),
      });

      const qrCode = await QRCode.toDataURL(qrPayload);
      booking.qrCode = qrCode;
      await booking.save();

      const ticketPdfBuffer = await generateTicketPdfBuffer({
        booking,
        event,
        user: req.user,
        qrCodeDataUrl: qrCode,
      });

      event.seatsBooked += tickets;
      await event.save();
      seatsUpdated = true;

      populated = await Booking.findById(booking._id)
        .populate('eventId')
        .populate('userId', 'name email');

      await logActivity(req, {
        actionType: 'booking_created',
        actorUserId: req.user._id,
        actorEmail: req.user.email,
        targetEntity: 'booking',
        targetId: booking._id.toString(),
        details: {
          eventId: event._id.toString(),
          eventTitle: event.title,
          eventDate: event.date,
          eventTime: event.time,
          eventVenue: event.venue,
          poster: event.image,
          tickets,
          seats: booking.selectedSeats,
          bookingReference: booking.bookingReference,
          paymentStatus: booking.paymentStatus,
          paymentMethod: booking.paymentMethod,
          transactionId: booking.paymentTransactionId,
          paymentAmount: booking.paymentAmount,
          couponCode: booking.couponCode,
        },
      });

      const bookingMail = bookingTemplate({
        name: req.user.name,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        venue: event.venue,
        tickets: booking.tickets,
        amount: booking.paymentAmount,
        paymentMethod: booking.paymentMethod,
        transactionId: booking.paymentTransactionId || 'N/A',
        seats: booking.selectedSeats?.join(', ') || 'N/A',
        bookingReference: booking.bookingReference,
        convenienceFee: booking.convenienceFee,
        gstAmount: booking.gstAmount,
        discountAmount: booking.discountAmount,
        paymentStatus: booking.paymentStatus,
      });

      sendEmail({
        to: req.user.email,
        subject: bookingMail.subject,
        html: bookingMail.html,
        attachments: [
          {
            filename: `${booking.bookingReference}-ticket.png`,
            content: dataUrlToBuffer(booking.qrCode),
            contentType: 'image/png',
            cid: 'ticketqr',
          },
          {
            filename: `${booking.bookingReference}.pdf`,
            content: ticketPdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      }).catch((mailError) => {
        // eslint-disable-next-line no-console
        console.error('Booking email send failed:', mailError.message);
      });
    } catch (postCreateError) {
      if (seatsUpdated) {
        event.seatsBooked = Math.max(0, event.seatsBooked - tickets);
        await event.save();
      }

      if (booking?._id) {
        await Booking.deleteOne({ _id: booking._id }).catch(() => null);
      }

      if (walletDebitResult?.transaction) {
        await creditWallet({
          userId: req.user._id,
          amount: pricing.totalAmount,
          description: `Reversal for failed booking ${bookingReference}`,
          source: 'refund',
          referenceId: bookingReference,
          referenceType: 'booking',
          paymentMethod: 'wallet',
          meta: {
            eventId: event._id.toString(),
            eventTitle: event.title,
            bookingReference,
            reason: 'booking_post_create_failed',
          },
        }).catch(() => null);
      }

      throw postCreateError;
    }

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully.',
      data: populated,
    });
  })
);

router.get(
  '/event/:eventId/occupied-seats',
  [param('eventId').isMongoId().withMessage('Invalid event id.')],
  validate,
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find({
      eventId: req.params.eventId,
      bookingStatus: 'approved',
    }).select('selectedSeats');

    const occupiedSeats = bookings.flatMap((booking) => booking.selectedSeats || []);

    return res.status(200).json({
      success: true,
      data: occupiedSeats,
    });
  })
);

router.get(
  '/my-tickets',
  auth,
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('eventId')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: bookings,
    });
  })
);

router.get(
  '/:id/ticket-pdf',
  auth,
  [param('id').isMongoId().withMessage('Invalid booking id.')],
  validate,
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id)
      .populate('eventId')
      .populate('userId', 'name email role');

    if (!booking) {
      throw new HttpError(404, 'Booking not found.');
    }

    const isOwner = String(booking.userId?._id) === String(req.user._id);
    const isAdminUser = req.user.role === 'admin';

    if (!isOwner && !isAdminUser) {
      throw new HttpError(403, 'Not authorized to access this ticket PDF.');
    }

    const ticketPdfBuffer = await generateTicketPdfBuffer({
      booking,
      event: booking.eventId,
      user: booking.userId,
      qrCodeDataUrl: booking.qrCode,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${booking.bookingReference}.pdf"`);
    return res.status(200).send(ticketPdfBuffer);
  })
);

router.get(
  '/history',
  auth,
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('eventId', 'title date time venue')
      .sort({ createdAt: -1 });

    const bookingHistory = bookings.map((booking) => ({
      id: booking._id,
      bookingReference: booking.bookingReference,
      eventTitle: booking.eventId?.title || 'Event',
      eventDate: booking.eventId?.date || '',
      eventTime: booking.eventId?.time || '',
      venue: booking.eventId?.venue || '',
      seats: booking.selectedSeats || [],
      tickets: booking.tickets,
      bookingStatus: booking.bookingStatus,
      checkInStatus: booking.checkInStatus,
      checkedInAt: booking.checkedInAt,
      bookedAt: booking.createdAt,
      cancelledAt: booking.cancelledAt,
    }));

    const paymentHistory = bookings.flatMap((booking) =>
      (booking.paymentLogs || []).map((paymentLog) => ({
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        eventTitle: booking.eventId?.title || 'Event',
        status: paymentLog.status,
        note: paymentLog.note,
        amount: booking.paymentAmount,
        method: booking.paymentMethod,
        transactionId: booking.paymentTransactionId,
        at: paymentLog.at,
      }))
    );

    return res.status(200).json({
      success: true,
      data: {
        bookingHistory,
        paymentHistory,
      },
    });
  })
);

router.patch(
  '/:id/cancel',
  auth,
  [param('id').isMongoId().withMessage('Invalid booking id.')],
  validate,
  asyncHandler(async (req, res) => {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id }).populate('eventId');
    if (!booking) {
      throw new HttpError(404, 'Booking not found.');
    }

    if (booking.bookingStatus === 'cancelled') {
      throw new HttpError(400, 'Booking is already cancelled.');
    }

    booking.bookingStatus = 'cancelled';
    booking.eventId.seatsBooked = Math.max(0, booking.eventId.seatsBooked - booking.tickets);
    await booking.eventId.save();

    if (booking.paymentStatus === 'paid' && booking.paymentAmount > 0) {
      await creditWallet({
        userId: req.user._id,
        amount: booking.paymentAmount,
        description: `Refund for cancelled booking ${booking.bookingReference}`,
        source: 'refund',
        referenceId: booking.bookingReference,
        referenceType: 'booking',
        paymentMethod: booking.paymentMethod || 'wallet',
        meta: {
          bookingId: booking._id.toString(),
          eventId: booking.eventId?._id?.toString() || '',
          eventTitle: booking.eventId?.title || '',
        },
      });
    }

    await booking.save();

    await logActivity(req, {
      actionType: 'booking_status_updated',
      actorUserId: req.user._id,
      actorEmail: req.user.email,
      targetEntity: 'booking',
      targetId: booking._id.toString(),
      details: {
        bookingStatus: 'cancelled',
        by: 'user',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
    });
  })
);

router.get(
  '/admin',
  auth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('eventId', 'title date venue')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: bookings,
    });
  })
);

router.patch(
  '/:id/status',
  auth,
  requireAdmin,
  [
    param('id').isMongoId().withMessage('Invalid booking id.'),
    body('bookingStatus').isIn(['approved', 'cancelled']).withMessage('Invalid booking status.'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id).populate('eventId');
    if (!booking) {
      throw new HttpError(404, 'Booking not found.');
    }

    if (booking.bookingStatus !== req.body.bookingStatus) {
      if (req.body.bookingStatus === 'cancelled') {
        booking.eventId.seatsBooked = Math.max(0, booking.eventId.seatsBooked - booking.tickets);
      }
      if (booking.bookingStatus === 'cancelled' && req.body.bookingStatus === 'approved') {
        booking.eventId.seatsBooked += booking.tickets;
      }
      await booking.eventId.save();
    }

    booking.bookingStatus = req.body.bookingStatus;
    await booking.save();

    await logActivity(req, {
      actionType: 'booking_status_updated',
      actorUserId: req.user._id,
      actorEmail: req.user.email,
      targetEntity: 'booking',
      targetId: booking._id.toString(),
      details: {
        bookingStatus: booking.bookingStatus,
        eventId: booking.eventId?._id?.toString() || '',
      },
    });

    const updated = await Booking.findById(booking._id)
      .populate('userId', 'name email')
      .populate('eventId', 'title date venue');

    return res.status(200).json({
      success: true,
      message: 'Booking status updated.',
      data: updated,
    });
  })
);

router.patch(
  '/:id/check-in',
  auth,
  requireAdmin,
  [
    param('id').isMongoId().withMessage('Invalid booking id.'),
    body('checkInStatus').optional().isIn(['checked_in', 'not_checked_in']).withMessage('Invalid check-in status.'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id).populate('eventId', 'title date venue').populate('userId', 'name email');
    if (!booking) {
      throw new HttpError(404, 'Booking not found.');
    }

    if (booking.bookingStatus !== 'approved') {
      throw new HttpError(400, 'Only approved bookings can be checked in.');
    }

    const nextCheckInStatus = req.body.checkInStatus || 'checked_in';

    if (nextCheckInStatus === 'checked_in' && booking.checkInStatus === 'checked_in') {
      throw new HttpError(409, 'Ticket is already checked in.');
    }

    if (nextCheckInStatus === 'checked_in') {
      booking.checkInStatus = 'checked_in';
      booking.checkedInAt = new Date();
      booking.checkedInBy = req.user._id;
    } else {
      booking.checkInStatus = 'not_checked_in';
      booking.checkedInAt = null;
      booking.checkedInBy = null;
    }

    await booking.save();

    await logActivity(req, {
      actionType: 'booking_check_in_updated',
      actorUserId: req.user._id,
      actorEmail: req.user.email,
      targetEntity: 'booking',
      targetId: booking._id.toString(),
      details: {
        checkInStatus: booking.checkInStatus,
        checkedInAt: booking.checkedInAt,
        bookingReference: booking.bookingReference,
        eventId: booking.eventId?._id?.toString() || '',
        eventTitle: booking.eventId?.title || '',
        studentEmail: booking.userId?.email || '',
      },
    });

    return res.status(200).json({
      success: true,
      message: booking.checkInStatus === 'checked_in' ? 'Check-in recorded successfully.' : 'Check-in reset successfully.',
      data: booking,
    });
  })
);

router.patch(
  '/:id/payment',
  auth,
  requireAdmin,
  [
    param('id').isMongoId().withMessage('Invalid booking id.'),
    body('paymentStatus').isIn(['pending', 'paid', 'failed']).withMessage('Invalid payment status.'),
    body('note').optional().isString(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id).populate('eventId', 'title date time venue').populate('userId', 'name email');
    if (!booking) {
      throw new HttpError(404, 'Booking not found.');
    }

    booking.paymentStatus = req.body.paymentStatus;
    booking.paidAt = req.body.paymentStatus === 'paid' ? new Date() : booking.paidAt;
    booking.paymentLogs.push({
      status: req.body.paymentStatus,
      note: req.body.note || 'Payment status updated by admin',
      at: new Date(),
    });
    await booking.save();

    await logActivity(req, {
      actionType: 'payment_status_updated',
      actorUserId: req.user._id,
      actorEmail: req.user.email,
      targetEntity: 'booking',
      targetId: booking._id.toString(),
      details: {
        paymentStatus: booking.paymentStatus,
        eventId: booking.eventId?._id?.toString() || '',
        eventTitle: booking.eventId?.title || '',
        studentEmail: booking.userId?.email || '',
      },
    });

    if (booking.paymentStatus === 'paid') {
      const ticketPdfBuffer = await generateTicketPdfBuffer({
        booking,
        event: booking.eventId,
        user: booking.userId,
        qrCodeDataUrl: booking.qrCode,
      });

      const paymentMail = bookingTemplate({
        name: booking.userId?.name || 'Student',
        eventTitle: booking.eventId?.title || 'Event',
        eventDate: booking.eventId?.date || 'N/A',
        eventTime: booking.eventId?.time || 'N/A',
        venue: booking.eventId?.venue || 'N/A',
        tickets: booking.tickets,
        amount: booking.paymentAmount,
        paymentMethod: booking.paymentMethod,
        transactionId: booking.paymentTransactionId || 'N/A',
        seats: booking.selectedSeats?.join(', ') || 'N/A',
        bookingReference: booking.bookingReference,
        convenienceFee: booking.convenienceFee,
        gstAmount: booking.gstAmount,
        discountAmount: booking.discountAmount,
        paymentStatus: booking.paymentStatus,
      });

      sendEmail({
        to: booking.userId?.email,
        subject: paymentMail.subject,
        html: paymentMail.html,
        attachments: [
          {
            filename: `${booking.bookingReference}-ticket.png`,
            content: dataUrlToBuffer(booking.qrCode),
            contentType: 'image/png',
            cid: 'ticketqr',
          },
          {
            filename: `${booking.bookingReference}.pdf`,
            content: ticketPdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      }).catch(() => null);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment status updated.',
      data: booking,
    });
  })
);

router.get(
  '/admin/summary',
  auth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const [totalUsers, totalEvents, totalBookings, checkedInBookings, paidBookings] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Event.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ checkInStatus: 'checked_in' }),
      Booking.find({ paymentStatus: 'paid' }).populate('eventId', 'price tickets'),
    ]);

    const revenue = paidBookings.reduce((sum, booking) => {
      const price = booking.eventId?.price || 0;
      return sum + price * booking.tickets;
    }, 0);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalEvents,
        totalBookings,
        checkedInBookings,
        totalRevenue: revenue,
      },
    });
  })
);

module.exports = router;
