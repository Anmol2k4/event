import express from 'express';
import Interest from '../models/Interest.js';
import User from '../models/User.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
const router = express.Router();

// Get all interests (admin only - business sensitive)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const interests = await Interest.find().populate('user_id event_id');
    res.json(interests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch interests' });
  }
});

// Get all events a user is interested in
router.get('/user/:userId', async (req, res) => {
  const interests = await Interest.find({ user_id: req.params.userId }).populate('event_id');
  res.json(interests.map(i => i.event_id));
});

// Delete an interest (unshow interest)
router.delete('/:id', async (req, res) => {
  const interest = await Interest.findByIdAndDelete(req.params.id);
  if (!interest) return res.status(404).json({ error: 'Interest not found' });
  res.json({ message: 'Interest removed' });
});

// Show interest in event
router.post('/', async (req, res) => {
  try {
    const { user_id, event_id } = req.body;
    
    // Check if user already showed interest in this event
    const existingInterest = await Interest.findOne({ 
      user_id: user_id, 
      event_id: event_id 
    });
    
    if (existingInterest) {
      return res.status(400).json({ error: 'You have already shown interest in this event' });
    }
    
    const interest = new Interest({ ...req.body });
    await interest.save();
    res.status(201).json(interest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register interest' });
  }
});

// Get interested users for an event (admin only - business sensitive data)
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  console.log('\n=== INTERESTED USERS REQUEST ===');
  console.log('Event ID:', req.params.eventId);
  console.log('User from token:', req.user);
  
  try {
    // Import Event model to check if user is event creator
    const Event = (await import('../models/Event.js')).default;
    
    // Check if user is admin or event creator
    console.log('Looking for event with ID:', req.params.eventId);
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      console.log('❌ Event not found');
      return res.status(404).json({ error: 'Event not found' });
    }
    
    console.log('✅ Event found:', event.title);
    console.log('Event creator ID:', event.user_id);
    
    // Check user properties - the JWT token has 'id' property (not 'userId')
    const userId = req.user.id; // JWT token uses 'id' property
    const userRole = req.user.role;
    
    console.log('Current user ID:', userId);
    console.log('Current user role:', userRole);
    
    const isAdmin = userRole === 'admin';
    
    console.log('Authorization check:', {
      isAdmin,
      userRole,
      userId: userId?.toString()
    });
    
    if (!isAdmin) {
      console.log('❌ Access denied - admin access required');
      return res.status(403).json({ 
        error: 'Access denied. Only admins can view interested users.',
        debug: { isAdmin, userRole, userId: userId?.toString() }
      });
    }
    
    console.log('✅ Access granted, fetching interests...');
    const interests = await Interest.find({ event_id: req.params.eventId }).populate('user_id');
    console.log(`Found ${interests.length} interested users`);
    
    if (interests.length === 0) {
      console.log('No interests found for this event');
      return res.json([]);
    }
    
    const users = interests.map((interest, index) => {
      console.log(`Processing interest ${index + 1}:`, {
        userId: interest.user_id?._id,
        userName: interest.user_id?.name
      });
      
      if (!interest.user_id) {
        console.log('⚠️  Interest missing user data:', interest);
        return null;
      }
      
      return {
        _id: interest.user_id._id,
        name: interest.user_id.name,
        email: interest.user_id.email,
        phone: interest.user_id.phone || '',
        role: interest.user_id.role,
        location: interest.user_id.location || '',
        company: interest.user_id.company || '',
        position: interest.user_id.position || '',
        bio: interest.user_id.bio || '',
        experience: interest.user_id.experience || '',
        skills: interest.user_id.skills || '',
        profile_photo: interest.user_id.profile_photo || '',
        createdAt: interest.createdAt
      };
    }).filter(user => user !== null);
    
    console.log(`✅ Returning ${users.length} valid users`);
    res.json(users);
  } catch (error) {
    console.error('❌ Error in interested users endpoint:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch interested users',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
