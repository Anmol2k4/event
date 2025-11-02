// Simple script to add a test event via API
const fetch = require('node-fetch');

const eventData = {
  title: "Sample Event with Contact Info",
  description: "This is a test event to verify contact information display",
  event_date: "2025-12-01",
  location: "Test Location, New Delhi",
  planner_name: "John Doe",
  contact_email: "john.doe@example.com",
  contact_phone: "+91-9876543210",
  status: "approved"
};

async function addTestEvent() {
  try {
    const response = await fetch('http://localhost:5000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Event created successfully:', result);
    } else {
      console.error('Failed to create event:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error creating event:', error);
  }
}

addTestEvent();