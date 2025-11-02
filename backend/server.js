import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import session from 'express-session';
import eventsRouter from './routes/events.js';
import usersRouter from './routes/users.js';
import interestsRouter from './routes/interests.js';
import reviewsRouter from './routes/reviews.js';
import photosRouter from './routes/photos.js';
import authRouter from './routes/auth.js';
import passport from './config/passport.js';

const app = express();
app.use(cors({
  origin: '*', // In production, specify your frontend domain
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('./uploads'));

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Debug route to check interests in database
app.get('/api/debug/interests', async (req, res) => {
  try {
    const Interest = (await import('./models/Interest.js')).default;
    const interests = await Interest.find().populate('user_id event_id');
    res.json({
      count: interests.length,
      interests: interests.map(i => ({
        _id: i._id,
        event_title: i.event_id?.title || 'Unknown Event',
        user_name: i.user_id?.name || 'Unknown User',
        created: i.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/events', eventsRouter);
app.use('/api/users', usersRouter);
app.use('/api/interests', interestsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/photos', photosRouter);
app.use('/api/auth', authRouter);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://anmolpandey101112_db_user:A5hms12SEFI5GLLF@evnets.uxu9glr.mongodb.net/?retryWrites=true&w=majority&appName=evnets';
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));
