import mongoose from 'mongoose';

const interestSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Ensure unique combination of user_id and event_id (no duplicate interests)
interestSchema.index({ user_id: 1, event_id: 1 }, { unique: true });

export default mongoose.model('Interest', interestSchema);