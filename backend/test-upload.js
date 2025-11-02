// Test script to check photo upload functionality
console.log('Testing photo upload system...');

// Check if the backend server is running
fetch('http://localhost:5000/api/photos/event/test')
  .then(response => {
    console.log('Backend server status:', response.status);
    if (response.ok) {
      console.log('✓ Backend server is running');
    } else {
      console.log('✗ Backend server error:', response.statusText);
    }
  })
  .catch(error => {
    console.log('✗ Backend server not accessible:', error.message);
  });

// Check if uploads directory exists by trying to access a test file
fetch('http://localhost:5000/uploads/photos/')
  .then(response => {
    console.log('Uploads directory accessible:', response.status !== 404);
  })
  .catch(error => {
    console.log('Uploads directory check failed:', error.message);
  });