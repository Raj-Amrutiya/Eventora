const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const env = require('../config/env');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { auth } = require('../middleware/auth');
const HttpError = require('../utils/httpError');
const logActivity = require('../utils/activityLogger');
const sendEmail = require('../utils/mailer');
const { signupTemplate, loginTemplate } = require('../utils/emailTemplates');

const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

router.post(
  '/signup',
  [
    body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long.'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new HttpError(409, 'Email already registered.');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    });

    await Wallet.create({
      userId: user._id,
      balance: 0,
      currency: 'INR',
    });

    const token = signToken(user._id.toString());

    await logActivity(req, {
      actionType: 'signup',
      actorUserId: user._id,
      actorEmail: user.email,
      targetEntity: 'user',
      targetId: user._id.toString(),
      details: {
        role: user.role,
      },
    });

    const signupMail = signupTemplate({
      name: user.name,
      email: user.email,
      password,
    });

    sendEmail({
      to: user.email,
      subject: signupMail.subject,
      html: signupMail.html,
    }).catch(() => null);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  })
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      await logActivity(req, {
        actionType: 'login_failed',
        actorEmail: email,
        targetEntity: 'user',
        details: {
          reason: 'user_not_found',
        },
      });
      throw new HttpError(401, 'Invalid credentials.');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      await logActivity(req, {
        actionType: 'login_failed',
        actorUserId: user._id,
        actorEmail: user.email,
        targetEntity: 'user',
        targetId: user._id.toString(),
        details: {
          reason: 'invalid_password',
        },
      });
      throw new HttpError(401, 'Invalid credentials.');
    }

    if (user.isBlocked) {
      await logActivity(req, {
        actionType: 'login_failed',
        actorUserId: user._id,
        actorEmail: user.email,
        targetEntity: 'user',
        targetId: user._id.toString(),
        details: {
          reason: 'blocked_user',
        },
      });
      throw new HttpError(403, 'Your account is blocked.');
    }

    const token = signToken(user._id.toString());

    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip || req.socket?.remoteAddress || '';
    user.lastLoginUserAgent = req.get('user-agent') || '';
    await user.save();

    await logActivity(req, {
      actionType: 'login_success',
      actorUserId: user._id,
      actorEmail: user.email,
      targetEntity: 'user',
      targetId: user._id.toString(),
      details: {
        role: user.role,
      },
    });

    const loginMail = loginTemplate({
      name: user.name,
      loginAt: new Date().toISOString(),
    });

    sendEmail({
      to: user.email,
      subject: loginMail.subject,
      html: loginMail.html,
    }).catch(() => null);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  })
);

router.get(
  '/me',
  auth,
  asyncHandler(async (req, res) => {
    return res.status(200).json({
      success: true,
      data: req.user,
    });
  })
);

module.exports = router;
