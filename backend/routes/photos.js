import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Photo from '../models/Photo.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads/photos';
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Debug endpoint to check photo system
router.get('/debug', (req, res) => {
  res.json({
    message: 'Photo system is working',
    uploadsDir: uploadsDir,
    timestamp: new Date().toISOString()
  });
});

// Get all photos for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    console.log('Fetching photos for event:', req.params.eventId);
    const photos = await Photo.find({ 
      event_id: req.params.eventId,
      is_approved: true 
    }).sort({ createdAt: -1 });
    
    console.log('Found photos:', photos.length);
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(400).json({ error: 'Failed to fetch photos' });
  }
});

// Get all photos by a user
router.get('/user/:userId', async (req, res) => {
  try {
    const photos = await Photo.find({ user_id: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(photos);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch user photos' });
  }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err) {
    console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 5MB)' });
    }
    if (err.message === 'Only image files are allowed!') {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Upload photos for an event
router.post('/upload/:eventId', authenticateToken, upload.array('photos', 10), handleUploadError, async (req, res) => {
  try {
    console.log('Photo upload started for event:', req.params.eventId);
    console.log('Files received:', req.files?.length || 0);
    console.log('User ID:', req.user?.id);
    
    const eventId = req.params.eventId;
    const userId = req.user.id;
    const { captions } = req.body; // Array of captions for each photo

    // Get event and user details
    const event = await Event.findById(eventId);
    const user = await User.findById(userId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is the event owner or admin
    const isEventOwner = event.user_id && event.user_id.toString() === userId;
    const isAdmin = user.role === 'admin';
    
    if (!isEventOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only event owners can upload photos for this event' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No photos uploaded' });
    }

    // Parse captions if it's a string
    let captionsArray = [];
    if (captions) {
      captionsArray = typeof captions === 'string' ? JSON.parse(captions) : captions;
    }

    // Save photo records to database
    const photoPromises = req.files.map(async (file, index) => {
      const photo = new Photo({
        event_id: eventId,
        user_id: userId,
        filename: file.filename,
        original_name: file.originalname,
        file_path: file.path,
        file_size: file.size,
        mime_type: file.mimetype,
        caption: captionsArray[index] || '',
        user_name: user.name,
        event_title: event.title
      });

      return await photo.save();
    });

    const savedPhotos = await Promise.all(photoPromises);
    console.log('Photos saved successfully:', savedPhotos.length);
    res.status(201).json({ photos: savedPhotos });
  } catch (error) {
    console.error('Photo upload error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 5MB)' });
    }
    if (error.message === 'Only image files are allowed!') {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }
    res.status(500).json({ error: 'Failed to upload photos: ' + error.message });
  }
});

// Serve photo files
router.get('/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).json({ error: 'Photo not found' });
  }
});

// Delete a photo (user can delete their own photos)
router.delete('/:photoId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const photo = await Photo.findOne({ 
      _id: req.params.photoId, 
      user_id: userId 
    });

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found or unauthorized' });
    }

    // Delete file from filesystem
    if (fs.existsSync(photo.file_path)) {
      fs.unlinkSync(photo.file_path);
    }

    // Delete from database
    await Photo.findByIdAndDelete(req.params.photoId);
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete photo' });
  }
});

// Admin: Approve/reject photo
router.patch('/:photoId/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const photo = await Photo.findByIdAndUpdate(
      req.params.photoId,
      { is_approved: true },
      { new: true }
    );
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    res.json(photo);
  } catch (error) {
    res.status(400).json({ error: 'Failed to approve photo' });
  }
});

router.patch('/:photoId/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const photo = await Photo.findByIdAndUpdate(
      req.params.photoId,
      { is_approved: false },
      { new: true }
    );
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    res.json(photo);
  } catch (error) {
    res.status(400).json({ error: 'Failed to reject photo' });
  }
});

export default router;