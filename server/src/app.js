const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/events.routes');
const bookingRoutes = require('./routes/bookings.routes');
const userRoutes = require('./routes/users.routes');
const miscRoutes = require('./routes/misc.routes');
const activityRoutes = require('./routes/activity.routes');
const previousEventsRoutes = require('./routes/previousEvents.routes');
const notificationRoutes = require('./routes/notifications.routes');
const walletRoutes = require('./routes/wallet.routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);
app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy' });
});
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/previous-events', previousEventsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api', miscRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
