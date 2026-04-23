const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const env = require('../config/env');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const PreviousEvent = require('../models/PreviousEvent');

const events = [
  {
    title: 'Satrang Unifest 2026',
    description: 'Ganpat University flagship cultural festival with dance, drama, music, street performances and inter-school competitions.',
    category: 'Cultural',
    date: '2026-02-12',
    time: '05:00 PM',
    venue: 'Open Air Theatre, Ganpat University',
    organizer: 'Student Activity Cell',
    seats: 10000,
    seatsBooked: 3500,
    price: 99,
    featured: true,
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'YuvaRangat Navratri Festival',
    description: 'Annual Navratri Garba and cultural celebration with live orchestra, student performances and traditional competition rounds.',
    category: 'Cultural',
    date: '2026-10-07',
    time: '07:30 PM',
    venue: 'Main Ground, Ganpat University',
    organizer: 'Cultural Council',
    seats: 7000,
    seatsBooked: 2100,
    price: 149,
    featured: true,
    image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Annual Day Garba Mahotsav',
    description: 'Campus-wide Annual Day celebration with award ceremony, performances, Garba and alumni participation.',
    category: 'Cultural',
    date: '2026-01-30',
    time: '06:00 PM',
    venue: 'Open Air Theatre, Ganpat University',
    organizer: 'University Administration',
    seats: 10000,
    seatsBooked: 4200,
    price: 0,
    featured: true,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'GCeMP International Conference Series',
    description: 'International conference on management practices, sustainability, business innovation and emerging technology in education.',
    category: 'Academic',
    date: '2026-03-20',
    time: '10:00 AM',
    venue: 'Management Auditorium, Ganpat University',
    organizer: 'GCeMP',
    seats: 1200,
    seatsBooked: 650,
    price: 299,
    featured: false,
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'NEP 2020 Workshop & Seminar',
    description: 'Academic workshop focused on NEP 2020 implementation, modern pedagogy and innovation in higher education systems.',
    category: 'Workshop',
    date: '2026-05-09',
    time: '11:00 AM',
    venue: 'Seminar Hall - B Block',
    organizer: 'Academic Development Cell',
    seats: 600,
    seatsBooked: 240,
    price: 0,
    featured: false,
    image: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Innovation & Research Convention',
    description: 'Research paper showcase, prototype exhibitions and innovation workshops for technical and research-focused students.',
    category: 'Technical',
    date: '2026-08-14',
    time: '09:30 AM',
    venue: 'Innovation Hub, Ganpat University',
    organizer: 'Research and Innovation Council',
    seats: 900,
    seatsBooked: 310,
    price: 199,
    featured: false,
    image: 'https://images.unsplash.com/photo-1581090700227-4c4f50f11f43?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'National Youth Festival Showcase',
    description: 'National-level youth festival with talent showcase, art competitions and multi-university participation.',
    category: 'Mega',
    date: '2026-11-18',
    time: '04:00 PM',
    venue: 'Open Air Theatre, Ganpat University',
    organizer: 'Youth Affairs Department',
    seats: 10000,
    seatsBooked: 5000,
    price: 249,
    featured: true,
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Vibrant Gujarat Regional Conference',
    description: 'Industry-academia conference featuring global delegates, startups and regional innovation ecosystem participation.',
    category: 'Mega',
    date: '2026-09-05',
    time: '10:30 AM',
    venue: 'Convention Center, Ganpat University',
    organizer: 'Industry Relations Cell',
    seats: 3000,
    seatsBooked: 980,
    price: 399,
    featured: true,
    image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80',
  },
];

const previousEvents = [
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

const seed = async () => {
  try {
    await connectDB(env.mongodbUri);

    await Booking.deleteMany();
    await Event.deleteMany();
    await User.deleteMany();
    await PreviousEvent.deleteMany();

    const adminPassword = await bcrypt.hash('Admin@12345', 12);
    const studentPassword = await bcrypt.hash('Student@12345', 12);
    const rajPassword = await bcrypt.hash('Raj@12345', 12);

    await User.insertMany([
      {
        name: 'System Admin',
        email: 'admin@ganpatuniversity.edu.in',
        password: adminPassword,
        role: 'admin',
        phone: '+91 98765 43210',
        department: 'Administration',
        designation: 'System Administrator',
      },
      {
        name: 'Demo Student',
        email: 'student@ganpatuniversity.edu.in',
        password: studentPassword,
        role: 'user',
      },
      {
        name: 'Raj Patel',
        email: 'raj@ganpatuniversity.edu.in',
        password: rajPassword,
        role: 'user',
      },
    ]);

    await Event.insertMany(events);
    await PreviousEvent.insertMany(previousEvents);

    // eslint-disable-next-line no-console
    console.log('Database seeded successfully.');
    // eslint-disable-next-line no-console
    console.log('Admin: admin@ganpatuniversity.edu.in / Admin@12345');
    // eslint-disable-next-line no-console
    console.log('Student: student@ganpatuniversity.edu.in / Student@12345');
    // eslint-disable-next-line no-console
    console.log('Raj: raj@ganpatuniversity.edu.in / Raj@12345');
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seed();
