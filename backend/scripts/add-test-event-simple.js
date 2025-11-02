import mongoose from 'mongoose';

// Event Schema
const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  event_date: String,
  location: String,
  planner_name: String,
  contact_email: String,
  contact_phone: String,
  status: { type: String, default: 'pending' },
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

const MONGODB_URI = 'mongodb+srv://anmolpandey101112_db_user:A5hms12SEFI5GLLF@evnets.uxu9glr.mongodb.net/?retryWrites=true&w=majority&appName=evnets';

// Sample event with contact information
const sampleEvent = {
  title: "Test Event with Contact Info",
  description: "This is a test event to verify contact information display works correctly",
  event_date: "2025-12-15",
  location: "New Delhi Convention Center",
  planner_name: "John Smith",
  contact_email: "john.smith@example.com",
  contact_phone: "+91-9876543210",
  status: "approved"
};

async function addTestEvent() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Adding test event...');
    const createdEvent = await Event.create(sampleEvent);
    
    console.log('Successfully created event:');
    console.log('ID:', createdEvent._id);
    console.log('Title:', createdEvent.title);
    console.log('Planner:', createdEvent.planner_name);
    console.log('Email:', createdEvent.contact_email);
    console.log('Phone:', createdEvent.contact_phone);

  } catch (error) {
    console.error('Error adding test event:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
addTestEvent();