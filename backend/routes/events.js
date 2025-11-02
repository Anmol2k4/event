import express from 'express';
import jwt from 'jsonwebtoken';
import Event from '../models/Event.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
const router = express.Router();

// Get single event by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    // Check if user has permission to view contact information
    const authorizedRoles = [
      'Event Planner',
      'Event Manager',
      'Event Coordinator',
      'Operations Manager',
      'Production Manager',
      'Venue Manager',
      'Technical Manager',
      'Creative Director',
      'Artist Manager',
      'Media Agency',
      'Manpower Manager',
      'Anchor/Host',
      'admin'
    ];

    const eventResponse = { ...event.toObject() };

    // Remove sensitive contact information if user is not authorized
    if (!req.user?.role || !authorizedRoles.includes(req.user.role)) {
      delete eventResponse.contact_email;
      delete eventResponse.contact_phone;
    }

    res.json(eventResponse);
  } catch (err) {
    res.status(400).json({ error: 'Invalid event ID' });
  }
});

// Update event by ID
router.put('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(400).json({ error: 'Invalid event ID' });
  }
});

// Delete event by ID (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    // Store event info for response before deletion
    const deletedEventInfo = {
      id: event._id,
      title: event.title,
      status: event.status,
      event_date: event.event_date
    };
    
    await Event.findByIdAndDelete(req.params.id);
    res.json({ 
      message: `Event "${deletedEventInfo.title}" has been deleted successfully`,
      deletedEvent: deletedEventInfo
    });
  } catch (err) {
    console.error('Event deletion error:', err);
    res.status(400).json({ error: 'Failed to delete event' });
  }
});

// Get all approved events
router.get('/', async (req, res) => {
  try {
    console.log('Fetching events with interested users...');
    
    // First get all approved events
    const events = await Event.find({ status: 'approved' }).sort({ event_date: 1 });
    console.log(`Found ${events.length} approved events`);
    
    // Import Interest model to get interested users
    const Interest = (await import('../models/Interest.js')).default;
    
    // Get interested users for each event
    const eventsWithInterests = await Promise.all(
      events.map(async (event) => {
        const interests = await Interest.find({ event_id: event._id }).populate('user_id', 'name email role');
        console.log(`Event ${event.title} has ${interests.length} interested users`);
        
        const eventObj = event.toObject();
        // Filter out interests with null/undefined user_id and map the rest
        eventObj.interestedUsers = interests
          .filter(interest => interest.user_id && interest.user_id._id)
          .map(interest => ({
            _id: interest.user_id._id,
            name: interest.user_id.name,
            email: interest.user_id.email,
            role: interest.user_id.role
          }));
        
        return eventObj;
      })
    );
    
    // If user is not authenticated or not authorized, remove sensitive contact information
    const token = req.headers.authorization?.split(' ')[1];
    let isAuthorized = false;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
        const authorizedRoles = [
          'Event Planner',
          'Event Manager',
          'Event Coordinator',
          'Operations Manager',
          'Production Manager',
          'Venue Manager',
          'Technical Manager',
          'Creative Director',
          'Artist Manager',
          'Media Agency',
          'Manpower Manager',
          'Anchor/Host',
          'admin'
        ];
        isAuthorized = decoded.role && authorizedRoles.includes(decoded.role);
        console.log('User authorization check:', { decoded: decoded.role, isAuthorized });
      } catch (error) {
        console.log('Token verification error:', error.message);
      }
    } else {
      console.log('No authorization token found');
    }
    
    const eventsResponse = eventsWithInterests.map(event => {
      if (!isAuthorized) {
        delete event.contact_email;
        delete event.contact_phone;
      }
      
      return event;
    });
    
    console.log('Returning events with interested users data');
    res.json(eventsResponse);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Create new event (restricted to event organizers/planners)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if user has permission to create events
    const allowedRoles = [
      'event_planner',
      'event_manager', 
      'event_coordinator',
      'operations_manager',
      'production_manager',
      'venue_manager',
      'admin'  // Admin can create events for testing/management
    ];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Only event organizers and planners can create events.' 
      });
    }

    const event = new Event({ 
      ...req.body,
      user_id: req.user.id 
    });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Approve event (admin only)
router.patch('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
  res.json(event);
});

// Reject event (admin only)
router.patch('/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
  res.json(event);
});

// Get events by status (admin only)
router.get('/status/:status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const events = await Event.find({ status: req.params.status }).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

export default router;
