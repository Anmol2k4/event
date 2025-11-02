import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
const router = express.Router();

// Create profile photos directory
const profilePhotosDir = './uploads/profile-photos';
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}
if (!fs.existsSync(profilePhotosDir)) {
  fs.mkdirSync(profilePhotosDir, { recursive: true });
}

// Multer configuration for profile photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilePhotosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
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
    fileSize: 2 * 1024 * 1024, // 2MB limit
  }
});

// Register user with hashed password
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    
    // Security: Prevent admin role registration through public signup
    if (role === 'admin') {
      return res.status(403).json({ 
        error: 'Admin accounts cannot be created through public registration. Contact system administrator.' 
      });
    }
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ 
      name, 
      email, 
      phone, 
      password: hashed, 
      role: role || 'user' 
    });
    await user.save();
    
    const token = jwt.sign({ id: user._id, role: user.role }, 'secret_key', { expiresIn: '7d' });
    res.status(201).json({ 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      phone: user.phone, 
      role: user.role, 
      token 
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user (check hashed password)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, role: user.role }, 'secret_key', { expiresIn: '7d' });
  res.json({ id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'name email phone role createdAt').sort({ createdAt: -1 });
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt
    }));
    res.json(formattedUsers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role });
});

// ADMIN ONLY ROUTES - Secure admin management

// Create admin account (admin only)
router.post('/create-admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password and create admin user
    const hashed = await bcrypt.hash(password, 10);
    const adminUser = new User({
      name,
      email,
      phone: phone || '',
      password: hashed,
      role: 'admin'
    });
    
    await adminUser.save();
    
    res.status(201).json({
      message: 'Admin account created successfully',
      admin: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (err) {
    console.error('Admin creation error:', err);
    res.status(500).json({ error: 'Failed to create admin account' });
  }
});

// Promote existing user to admin (admin only)
router.patch('/promote-admin/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'User is already an admin' });
    }
    
    user.role = 'admin';
    await user.save();
    
    res.json({
      message: `User ${user.name} has been promoted to admin`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Admin promotion error:', err);
    res.status(500).json({ error: 'Failed to promote user to admin' });
  }
});

// Super Admin Setup Route (only works if no admins exist)
router.post('/setup-super-admin', async (req, res) => {
  try {
    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(403).json({ 
        error: 'Admin accounts already exist. Use admin panel to create additional admins.' 
      });
    }
    
    const { name, email, phone, password, superAdminKey } = req.body;
    
    // Check super admin key (should be set in environment variables)
    const expectedKey = process.env.SUPER_ADMIN_KEY;
    if (!expectedKey || superAdminKey !== expectedKey) {
      return res.status(403).json({ error: 'Invalid super admin key' });
    }
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Hash password and create super admin
    const hashed = await bcrypt.hash(password, 10);
    const superAdmin = new User({
      name,
      email,
      phone: phone || '',
      password: hashed,
      role: 'admin'
    });
    
    await superAdmin.save();
    
    const token = jwt.sign({ id: superAdmin._id, role: superAdmin.role }, 'secret_key', { expiresIn: '7d' });
    
    res.status(201).json({
      message: 'Super admin account created successfully',
      admin: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        token
      }
    });
  } catch (err) {
    console.error('Super admin setup error:', err);
    res.status(500).json({ error: 'Failed to setup super admin account' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Profile GET request - User ID:', req.user?.id);
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('User not found for ID:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('Profile found for user:', user.name);
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Profile PUT request - User ID:', req.user?.id);
    console.log('Profile data to update:', req.body);
    
    const {
      name,
      email,
      phone,
      location,
      bio,
      experience,
      skills,
      company,
      position,
      linkedin,
      portfolio,
      profile_photo
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        email,
        phone,
        location,
        bio,
        experience,
        skills,
        company,
        position,
        linkedin,
        portfolio,
        profile_photo
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      console.log('User not found for update, ID:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Profile updated successfully for user:', updatedUser.name);
    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user profile by ID (for viewing other users' profiles)
router.get('/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -email -phone');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Upload profile photo
router.post('/upload-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    res.json({
      message: 'Photo uploaded successfully',
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Serve profile photos
router.get('/photo/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(profilePhotosDir, filename);
  
  if (fs.existsSync(filepath)) {
    res.sendFile(path.resolve(filepath));
  } else {
    res.status(404).json({ error: 'Photo not found' });
  }
});

export default router;
