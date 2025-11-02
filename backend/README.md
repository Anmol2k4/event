# Backend Setup Instructions

1. Copy `.env.example` to `.env` and fill in your MongoDB Atlas connection string.

2. Install dependencies:
   ```sh
   cd backend
   npm install express mongoose cors dotenv
   ```

3. Start the server:
   ```sh
   node server.js
   ```

4. API Endpoints:
   - `POST   /api/users/register`   Register a new user
   - `POST   /api/users/login`      Login user
   - `GET    /api/users/:id`        Get user by ID
   - `GET    /api/events`           Get all approved events
   - `POST   /api/events`           Create new event
   - `PATCH  /api/events/:id/approve` Approve event (admin)
   - `PATCH  /api/events/:id/reject`  Reject event (admin)
   - `GET    /api/events/status/:status` Get events by status (admin)
   - `POST   /api/interests`        Show interest in event
   - `GET    /api/interests/event/:eventId` Get interested users for event

You can now connect your frontend to these endpoints!
