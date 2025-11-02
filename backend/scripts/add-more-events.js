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

// Additional sample events
const additionalEvents = [
  {
    title: "Music Festival 2025",
    description: "Join us for an amazing music festival featuring local and international artists",
    event_date: "2025-11-20",
    location: "Mumbai Music Park",
    planner_name: "Sarah Johnson",
    contact_email: "sarah.j@musicfest.org",
    contact_phone: "+91-9123456789",
    status: "approved"
  },
  {
    title: "Tech Startup Meetup",
    description: "Network with entrepreneurs and learn about the latest in technology and innovation",
    event_date: "2025-11-10",
    location: "Bangalore Tech Hub",
    planner_name: "Rajesh Patel",
    contact_email: "rajesh@startupnetwork.in",
    contact_phone: "+91-8765432109",
    status: "approved"
  },
  {
    title: "Food & Wine Festival",
    description: "Experience the finest cuisines and wines from around the world",
    event_date: "2025-12-05",
    location: "Goa Beach Resort",
    planner_name: "Maria Rodriguez",
    contact_email: "maria@foodwine.events",
    contact_phone: "+91-7654321098",
    status: "pending"
  }
];

async function addMoreEvents() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Adding additional events...');
    
    for (const eventData of additionalEvents) {
      const createdEvent = await Event.create(eventData);
      console.log(`✓ Created: ${createdEvent.title} by ${createdEvent.planner_name}`);
    }
    
    console.log(`\nSuccessfully added ${additionalEvents.length} events!`);

  } catch (error) {
    console.error('Error adding events:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
addMoreEvents();