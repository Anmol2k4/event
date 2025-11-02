import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 500 },
  user_name: { type: String, required: true },
  user_email: { type: String, required: true },
  event_title: { type: String, required: true },
  is_verified_attendee: { type: Boolean, default: false }, // True if user actually attended
}, { timestamps: true });

// Ensure one review per user per event
reviewSchema.index({ event_id: 1, user_id: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);