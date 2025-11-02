import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  event_date: String,
  location: String,
  planner_name: String,
  contact_email: String,
  contact_phone: String,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vendors_needed: [{
    type: String,
    enum: [
      'caterer',
      'photographer', 
      'dj',
      'decorator',
      'event_planner',
      'vendor',
      'volunteer',
      'sponsor',
      'other'
    ]
  }],
  status: { type: String, default: 'pending' },
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);