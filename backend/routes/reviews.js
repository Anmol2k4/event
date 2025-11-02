import express from 'express';
import Review from '../models/Review.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all reviews for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const reviews = await Review.find({ event_id: req.params.eventId })
      .sort({ createdAt: -1 });
    
    // Calculate average rating
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;
    
    res.json({
      reviews,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch reviews' });
  }
});

// Get all reviews by a user
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ user_id: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch user reviews' });
  }
});

// Create a new review
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { event_id, rating, comment } = req.body;
    const user_id = req.user.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get event and user details
    const event = await Event.findById(event_id);
    const user = await User.findById(user_id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if event has already ended (can only review past events)
    const eventDate = new Date(event.event_date);
    const currentDate = new Date();
    if (eventDate > currentDate) {
      return res.status(400).json({ error: 'Cannot review future events' });
    }

    // Check if user already reviewed this event
    const existingReview = await Review.findOne({ event_id, user_id });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this event' });
    }

    // Create review
    const review = new Review({
      event_id,
      user_id,
      rating,
      comment,
      user_name: user.name,
      user_email: user.email,
      event_title: event.title
    });

    await review.save();
    res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'You have already reviewed this event' });
    }
    res.status(400).json({ error: 'Failed to create review' });
  }
});

// Update a review
router.put('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const user_id = req.user.id;

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const review = await Review.findOne({ 
      _id: req.params.reviewId, 
      user_id 
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    // Update review
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save();
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update review' });
  }
});

// Delete a review
router.delete('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const review = await Review.findOne({ 
      _id: req.params.reviewId, 
      user_id 
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    await Review.findByIdAndDelete(req.params.reviewId);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete review' });
  }
});

export default router;