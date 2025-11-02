# Admin Security Setup Guide

## Overview
This application now implements a secure multi-layered admin system to prevent unauthorized admin account creation.

## Security Measures Implemented

### 1. **Frontend Protection**
- Removed "Admin" option from public signup form
- Only authorized roles available: Event Planner, Vendor, Volunteer, Sponsor, DJ, Photographer, Decorator, Caterer, Other

### 2. **Backend Validation**
- Public registration endpoint rejects admin role creation
- Returns error: "Admin accounts cannot be created through public registration"

### 3. **Admin-Only Creation Routes**
- `/api/users/create-admin` - Create new admin (requires existing admin authentication)
- `/api/users/promote-admin/:userId` - Promote existing user to admin
- `/api/users/setup-super-admin` - Initial super admin setup (one-time use)

### 4. **Super Admin Setup**
- Only works when NO admin accounts exist in the system
- Requires `SUPER_ADMIN_KEY` environment variable
- One-time setup for initial administrator

## Environment Variables Required

Add these to your `.env` file:

```env
# Super Admin Setup Key (change this to a strong, unique value)
SUPER_ADMIN_KEY=your-super-secret-admin-key-change-this-immediately

# JWT Secret (if not already set)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# MongoDB Connection (if not already set)
MONGODB_URI=mongodb+srv://your-connection-string
```

## Admin Setup Process

### Initial Setup (First Admin)
1. Set `SUPER_ADMIN_KEY` in your environment variables
2. Navigate to `/setup-super-admin`
3. Fill in admin details and provide the super admin key
4. This creates the first admin account

### Subsequent Admin Creation
1. Login as an existing admin
2. Go to Dashboard → "Admin Management" button
3. Use "Create Admin" tab to create new admin accounts
4. Or use "Manage Users" tab to promote existing users

## Security Features

### Authentication Middleware
- `authenticateToken` - Validates JWT tokens
- `requireAdmin` - Ensures admin role access

### Role-Based Access Control
- Public users: Cannot create admin accounts
- Admins: Can create other admins and promote users
- Super Admin Key: Required only for initial setup

### Database Constraints
- Admin role validation at application level
- JWT token verification for protected routes
- User role verification for admin operations

## API Endpoints

### Public Endpoints
- `POST /api/users/register` - Public registration (admin role blocked)
- `POST /api/users/login` - User authentication
- `POST /api/users/setup-super-admin` - One-time super admin setup

### Admin-Only Endpoints
- `POST /api/users/create-admin` - Create new admin account
- `PATCH /api/users/promote-admin/:userId` - Promote user to admin
- `GET /api/users` - List all users (for admin management)

## Frontend Routes

### Public Routes
- `/signup` - Public registration (no admin option)
- `/login` - User login
- `/setup-super-admin` - Initial admin setup

### Admin Routes
- `/admin/management` - Admin user management interface
- `/dashboard` - Shows "Admin Management" button for admins

## Testing the Security

1. **Test Public Signup**: Try to signup - admin option should not be available
2. **Test API Protection**: Direct API calls to create admin should fail without proper authentication
3. **Test Super Admin**: Should only work when no admins exist
4. **Test Admin Creation**: Should only work when authenticated as admin

## Important Notes

⚠️ **Security Reminders:**
- Always set a strong `SUPER_ADMIN_KEY`
- Keep your JWT secret secure
- The super admin setup only works once (when no admins exist)
- Regular users cannot elevate their privileges
- Admin creation requires existing admin authentication

✅ **What's Protected:**
- Public admin account creation ❌ Blocked
- Direct API admin creation ❌ Requires admin auth
- Super admin setup ✅ One-time only
- Admin management interface ✅ Admin-only access