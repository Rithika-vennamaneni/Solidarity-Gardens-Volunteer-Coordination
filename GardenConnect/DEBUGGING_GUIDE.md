# Debugging Guide - Solidarity Gardens Volunteer Tool

## Issues Fixed

### ✅ Issue 1: Volunteers Not Showing in Admin Dashboard
**Problem**: Volunteer submissions weren't being saved or displayed in the admin dashboard.

**Fixes Applied**:
1. **Frontend API calls** - Updated `client/src/lib/api.ts`:
   - `createVolunteer()` now uses `fetchPublic()` (no auth required for volunteer signup)
   - `getAllVolunteers()` uses `fetchWithAuth()` (admin auth required)
   - Added comprehensive console logging at every step

2. **Backend logging** - Updated `server/api-routes.ts`:
   - Added detailed logging to POST `/api/volunteers` endpoint
   - Added detailed logging to GET `/api/volunteers` endpoint
   - Logs show: request received → validation → database call → response

3. **Database logging** - Updated `server/db.ts`:
   - Added logging to `createVolunteer()` function
   - Added logging to `getAllVolunteers()` function
   - Logs show: function called → SQL execution → results returned

### ✅ Issue 2: Authentication Error When Posting Garden Needs
**Problem**: Admin was authenticated but API calls were failing with "Unauthorized: No authentication token provided".

**Fixes Applied**:
1. **Session-based authentication** - Updated `client/src/lib/api.ts`:
   - Changed from Stack Auth token to session storage check
   - Admin authentication now uses `sessionStorage.getItem('adminAuthenticated')`
   - Sends `Bearer admin-session-{timestamp}` token with admin requests

2. **Backend auth middleware** - Updated `server/auth.ts`:
   - Accepts `admin-session-*` tokens in development mode
   - Added comprehensive logging to show auth flow
   - Supports `BYPASS_AUTH=true` environment variable for testing

3. **Server startup** - Fixed `server/index.ts`:
   - Removed `reusePort` and `0.0.0.0` host options (caused Node.js v24 errors)
   - Server now binds to localhost by default

## How to Test

### 1. Start the Server

```bash
cd GardenConnect
npm run dev
```

**Expected Console Output**:
```
[DB] Connecting to database...
[DB] DATABASE_URL: postgresql://neondb_owner:npg...
[DB] Database connection established
serving on port 3001
```

### 2. Test Volunteer Submission

1. Navigate to: `http://localhost:3001/volunteer`
2. Fill out the volunteer form
3. Click "Submit"

**Check Browser Console** (F12 → Console tab):
```
[createVolunteer] Submitting volunteer data: {name: "...", email: "..."}
[API PUBLIC] Making request to: /api/volunteers
[API PUBLIC] Response status: 201
[API PUBLIC] Response data: {message: "...", volunteer: {...}}
```

**Check Server Terminal**:
```
[POST /api/volunteers] Received volunteer registration
[POST /api/volunteers] Request body: {name: "...", email: "..."}
[POST /api/volunteers] Creating volunteer in database...
[DB] createVolunteer called with data: {...}
[DB] createVolunteer result: {id: 1, name: "...", ...}
[POST /api/volunteers] Volunteer created successfully: {...}
POST /api/volunteers 201 in 45ms
```

### 3. Test Admin Login

1. Navigate to: `http://localhost:3001/admin-login`
2. Enter password: `solidarity2024`
3. Click "Login"

**Expected**: Redirected to `/admin` dashboard

**Check Browser Console**:
```
// Session storage should be set
sessionStorage.getItem('adminAuthenticated') // returns "true"
```

### 4. Test View Volunteers (Admin)

1. In admin dashboard, click "View All Volunteers" tab

**Check Browser Console**:
```
[getAllVolunteers] Fetching all volunteers
[API] Making request to: /api/volunteers
[API] Admin authenticated, adding auth header
[API] Response status: 200
[API] Response data: {volunteers: [{...}, {...}]}
```

**Check Server Terminal**:
```
[AUTH] Checking authentication for: GET /api/volunteers
[AUTH] Headers: Bearer admin-session-1730259600000
[AUTH] Token received: admin-session-173025...
[AUTH] Valid admin session token
[GET /api/volunteers] Fetching all volunteers from database...
[DB] getAllVolunteers called
[DB] getAllVolunteers found 2 volunteers
[GET /api/volunteers] Found 2 volunteers
GET /api/volunteers 200 in 32ms
```

### 5. Test Post Garden (Admin)

1. In admin dashboard, click "Post Garden" tab
2. Fill out the garden form
3. Click "Post Garden"

**Check Browser Console**:
```
[API] Making request to: /api/gardens
[API] Admin authenticated, adding auth header
[API] Response status: 201
[API] Response data: {message: "...", garden: {...}}
```

**Check Server Terminal**:
```
[AUTH] Checking authentication for: POST /api/gardens
[AUTH] Valid admin session token
POST /api/gardens 201 in 28ms
```

## Troubleshooting

### Problem: "No volunteers found" in admin dashboard

**Check**:
1. Open browser console (F12) and look for API errors
2. Check server terminal for database errors
3. Verify database connection:
   ```bash
   # Should see this on server start:
   [DB] Database connection established
   ```

**Solution**:
- If database connection fails, check `.env` file has correct `DATABASE_URL`
- Verify the `volunteers` table exists in Neon database
- Run the `database-schema.sql` script if tables don't exist

### Problem: "Unauthorized" error in admin dashboard

**Check**:
1. Verify you're logged in: `sessionStorage.getItem('adminAuthenticated')` should return `"true"`
2. Check browser console for auth token being sent
3. Check server terminal for auth middleware logs

**Solution**:
- Log out and log back in with password `solidarity2024`
- Clear session storage: `sessionStorage.clear()` then log in again
- Set `BYPASS_AUTH=true` in `.env` file for testing

### Problem: Server won't start (ENOTSUP error)

**Check**:
- Node.js version: `node --version` (should be v24+)
- Port already in use: `lsof -i :3001`

**Solution**:
- Server startup was fixed to remove `reusePort` option
- Change `PORT` in `.env` if 3001 is in use
- Kill existing process: `kill -9 <PID>`

### Problem: Database errors (table doesn't exist)

**Check Server Terminal**:
```
[DB] createVolunteer error: relation "volunteers" does not exist
```

**Solution**:
1. Go to Neon dashboard: https://console.neon.tech/
2. Open SQL Editor
3. Run the `database-schema.sql` script to create tables:
   ```sql
   CREATE TABLE IF NOT EXISTS volunteers (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     ...
   );
   ```

## Environment Variables

Make sure your `.env` file has:

```env
DATABASE_URL="postgresql://..."
STACK_PROJECT_ID=your_project_id
STACK_SECRET_KEY=your_secret_key
PORT=3001
NODE_ENV=development
BYPASS_AUTH=false  # Set to true to bypass auth for testing
```

## Logging Levels

All logs are prefixed with their source:
- `[DB]` - Database operations
- `[API]` - Frontend API calls
- `[API PUBLIC]` - Public API calls (no auth)
- `[AUTH]` - Authentication middleware
- `[POST /api/...]` - Backend POST endpoints
- `[GET /api/...]` - Backend GET endpoints

## Next Steps

Once everything is working:

1. **Remove debug logs** - Comment out `console.log` statements in production
2. **Implement real Stack Auth** - Replace session-based auth with Stack Auth SDK
3. **Add error boundaries** - Improve error handling in React components
4. **Add loading states** - Show spinners while data is fetching
5. **Add data validation** - Validate form inputs more thoroughly

## Database Schema Verification

To verify your database has the correct schema:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check volunteers table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'volunteers';

-- Count volunteers
SELECT COUNT(*) FROM volunteers;

-- View all volunteers
SELECT * FROM volunteers ORDER BY created_at DESC LIMIT 10;
```

## Support

If you're still having issues:
1. Check all console logs (browser + server)
2. Verify database connection and schema
3. Test API endpoints directly with curl or Postman
4. Check that all environment variables are set correctly
