import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  role: { type: String, default: 'user' },
  // Social login fields
  googleId: String,
  facebookId: String,
  linkedinId: String,
  avatar: String,
  isVerified: { type: Boolean, default: false },
  // Profile fields
  location: String,
  bio: String,
  experience: String,
  skills: String,
  company: String,
  position: String,
  linkedin: String,
  portfolio: String,
  profile_photo: String,
}, { timestamps: true });

export default mongoose.model('User', userSchema);