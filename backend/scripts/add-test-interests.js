import mongoose from 'mongoose';

// Interest Schema
const interestSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
}, { timestamps: true });

// Add unique compound index to prevent duplicates
interestSchema.index({ user_id: 1, event_id: 1 }, { unique: true });

const Interest = mongoose.model('Interest', interestSchema);

// User Schema (simplified for this script)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  role: { type: String, default: 'user' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Event Schema (simplified)
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

// Sample users to create interest
const sampleUsers = [
  { name: "Alice Smith", email: "alice@example.com", phone: "+91-9111111111", role: "volunteer" },
  { name: "Bob Johnson", email: "bob@example.com", phone: "+91-9222222222", role: "vendor" },
  { name: "Carol Brown", email: "carol@example.com", phone: "+91-9333333333", role: "sponsor" },
  { name: "David Wilson", email: "david@example.com", phone: "+91-9444444444", role: "photographer" },
  { name: "Emma Davis", email: "emma@example.com", phone: "+91-9555555555", role: "caterer" },
  { name: "Frank Miller", email: "frank@example.com", phone: "+91-9666666666", role: "dj" },
  { name: "Grace Taylor", email: "grace@example.com", phone: "+91-9777777777", role: "decorator" },
  { name: "Henry Clark", email: "henry@example.com", phone: "+91-9888888888", role: "event_planner" },
];

async function addTestInterests() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create sample users first
    console.log('Creating sample users...');
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
          const user = await User.create({
            ...userData,
            password: 'hashedpassword' // In real app this would be properly hashed
          });
          createdUsers.push(user);
          console.log(`✓ Created user: ${user.name}`);
        } else {
          createdUsers.push(existingUser);
          console.log(`• User exists: ${existingUser.name}`);
        }
      } catch (error) {
        console.log(`⚠ Error creating user ${userData.name}:`, error.message);
      }
    }

    // Get all events
    console.log('\nFetching events...');
    const events = await Event.find();
    console.log(`Found ${events.length} events`);

    if (events.length === 0) {
      console.log('No events found. Run the add-sample-events script first.');
      return;
    }

    // Create random interests
    console.log('\nCreating interests...');
    let interestCount = 0;

    for (const event of events) {
      // Randomly select 3-8 users to be interested in each event
      const numInterested = Math.floor(Math.random() * 6) + 3; // 3-8 users
      const shuffledUsers = [...createdUsers].sort(() => Math.random() - 0.5);
      const interestedUsers = shuffledUsers.slice(0, numInterested);

      for (const user of interestedUsers) {
        try {
          const interest = await Interest.create({
            user_id: user._id,
            event_id: event._id
          });
          interestCount++;
        } catch (error) {
          // Skip duplicates (unique constraint)
          if (!error.message.includes('duplicate')) {
            console.log(`⚠ Error creating interest:`, error.message);
          }
        }
      }

      console.log(`✓ ${event.title}: ${interestedUsers.length} interested users`);
    }

    console.log(`\n🎉 Successfully created ${interestCount} interests!`);
    console.log(`💰 Potential business revenue: ₹${interestCount * 50} (at ₹50 per connection)`);

  } catch (error) {
    console.error('Error adding test interests:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
addTestInterests();