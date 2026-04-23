const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/activityLogger');
const ContactMessage = require('../models/ContactMessage');

const router = express.Router();

router.post(
  '/contact',
  [
    body('name').isLength({ min: 2 }).withMessage('Name is required.'),
    body('email').isEmail().withMessage('Valid email is required.'),
    body('message').isLength({ min: 10 }).withMessage('Message must be at least 10 characters.'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, message } = req.body;

    const savedMessage = await ContactMessage.create({
      name,
      email,
      message,
      source: 'website',
    });

    await logActivity(req, {
      actionType: 'contact_submitted',
      actorEmail: email,
      targetEntity: 'contact',
      targetId: savedMessage._id.toString(),
      details: {
        name,
        messageLength: message.length,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Message received. Our team will get back to you soon.',
      data: {
        id: savedMessage._id,
        name,
        email,
        message,
        receivedAt: new Date().toISOString(),
      },
    });
  })
);

module.exports = router;
