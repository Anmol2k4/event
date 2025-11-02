import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  original_name: { type: String, required: true },
  file_path: { type: String, required: true },
  file_size: { type: Number, required: true },
  mime_type: { type: String, required: true },
  caption: { type: String, maxlength: 200 },
  user_name: { type: String, required: true },
  event_title: { type: String, required: true },
  is_approved: { type: Boolean, default: true }, // Admin can moderate photos
}, { timestamps: true });

export default mongoose.model('Photo', photoSchema);