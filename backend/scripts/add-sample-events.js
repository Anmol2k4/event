import mongoose from 'mongoose';
import Event from '../models/Event.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://anmolpandey101112_db_user:A5hms12SEFI5GLLF@evnets.uxu9glr.mongodb.net/?retryWrites=true&w=majority&appName=evnets';

// Sample events with contact information
const sampleEvents = [
  {
    title: "Tech Conference 2025",
    description: "Join us for the biggest tech conference of the year featuring AI, blockchain, and web development topics.",
    event_date: "2025-12-15",
    location: "New Delhi Convention Center",
    planner_name: "John Smith",
    contact_email: "john.smith@techconf.com",
    contact_phone: "+91-9876543210",
    status: "approved"
  },
  {
    title: "Music Festival Weekend",
    description: "Three days of amazing music performances from local and international artists.",
    event_date: "2025-11-20",
    location: "Mumbai Music Park",
    planner_name: "Sarah Johnson",
    contact_email: "sarah.j@musicfest.org",
    contact_phone: "+91-9123456789",
    status: "approved"
  },
  {
    title: "Startup Networking Event",
    description: "Connect with entrepreneurs, investors, and innovators in the startup ecosystem.",
    event_date: "2025-11-10",
    location: "Bangalore Tech Hub",
    planner_name: "Rajesh Patel",
    contact_email: "rajesh@startupnetwork.in",
    contact_phone: "+91-8765432109",
    status: "approved"
  },
  {
    title: "Food & Wine Tasting",
    description: "Experience the finest cuisines and wines from around the world.",
    event_date: "2025-12-01",
    location: "Goa Beach Resort",
    planner_name: "Maria Rodriguez",
    contact_email: "maria@foodwine.events",
    contact_phone: "+91-7654321098",
    status: "pending"
  }
];

async function addSampleEvents() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing events (optional)
    console.log('Clearing existing events...');
    await Event.deleteMany({});

    // Add sample events
    console.log('Adding sample events...');
    const createdEvents = await Event.insertMany(sampleEvents);
    
    console.log(`Successfully added ${createdEvents.length} sample events:`);
    createdEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} - ${event.planner_name} (${event.contact_email})`);
    });

  } catch (error) {
    console.error('Error adding sample events:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
addSampleEvents();