const express = require('express');
const PreviousEvent = require('../models/PreviousEvent');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const defaultPreviousEvents = [
  {
    title: 'Satrang Unifest 2025',
    poster: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
    date: '2025-02-10',
    time: '05:00 PM - 10:00 PM',
    venue: 'Open Air Theatre, Ganpat University',
    attendedStudents: 6800,
    department: 'Cultural Council, U.V. Patel College of Engineering',
    bannerLine: 'Inter-college performances, drama finals, and live music showcase.',
  },
  {
    title: 'YuvaRangat Navratri Festival 2025',
    poster: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80',
    date: '2025-10-05',
    time: '07:00 PM - 12:00 AM',
    venue: 'Main University Ground, Ganpat University',
    attendedStudents: 7400,
    department: 'Student Affairs and Cultural Cell',
    bannerLine: 'Traditional Garba night with faculty, alumni and student teams.',
  },
  {
    title: 'Innovation and Research Convention 2024',
    poster: 'https://images.unsplash.com/photo-1581090700227-4c4f50f11f43?auto=format&fit=crop&w=1200&q=80',
    date: '2024-08-18',
    time: '09:30 AM - 05:00 PM',
    venue: 'Innovation Hub and Seminar Block, Ganpat University',
    attendedStudents: 2300,
    department: 'Research and Innovation Council, Science and Engineering Departments',
    bannerLine: 'Prototype expo, paper presentations, and startup mentoring sessions.',
  },
  {
    title: 'National Youth Festival Showcase 2024',
    poster: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
    date: '2024-11-20',
    time: '04:00 PM - 09:00 PM',
    venue: 'Open Air Theatre, Ganpat University',
    attendedStudents: 9100,
    department: 'Youth Affairs Department and Event Coordination Committee',
    bannerLine: 'National talent finals, art arena, and cross-university performances.',
  },
];

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const count = await PreviousEvent.countDocuments();
    if (count === 0) {
      await PreviousEvent.insertMany(defaultPreviousEvents);
    }

    const previousEvents = await PreviousEvent.find().sort({ date: -1, createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: previousEvents,
    });
  })
);

module.exports = router;
