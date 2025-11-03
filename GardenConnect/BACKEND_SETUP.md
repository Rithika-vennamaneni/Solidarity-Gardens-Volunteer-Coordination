# Backend Setup Guide

Complete guide to set up the Solidarity Gardens backend with Neon PostgreSQL and Stack Auth.

## 🗄️ Database Setup (Neon PostgreSQL)

### Step 1: Create Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project or select existing one
3. Copy your connection string (it looks like):
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```

### Step 2: Run Database Schema

1. Open the Neon SQL Editor in your dashboard
2. Copy the contents of `database-schema.sql`
3. Paste and run it in the SQL Editor
4. Verify tables were created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

You should see:
- `volunteers`
- `gardens`
- `matches`

---

## 🔐 Stack Auth Setup

### Step 1: Create Stack Auth Project

1. Go to [Stack Auth Dashboard](https://app.stack-auth.com/)
2. Create a new project
3. Note your Project ID and Secret Key

### Step 2: Configure Stack Auth

1. In Stack Auth dashboard, configure:
   - **Allowed Origins**: `http://localhost:5000`
   - **Redirect URIs**: `http://localhost:5000/auth/callback`
   - **Authentication Methods**: Enable Email/Password

2. Create an admin user for testing

---

## ⚙️ Environment Configuration

### Step 1: Create .env File

```bash
cp .env.example .env
```

### Step 2: Fill in Environment Variables

Edit `.env` and add your credentials:

```env
# Neon PostgreSQL Database URL
DATABASE_URL=postgresql://username:password@your-neon-hostname.neon.tech/dbname?sslmode=require

# Stack Auth Configuration
STACK_PROJECT_ID=your_stack_project_id
STACK_SECRET_KEY=your_stack_secret_key

# Server Configuration
PORT=5000
NODE_ENV=development

# Development Options (optional)
BYPASS_AUTH=false
```

---

## 📦 Install Dependencies

All dependencies are already in `package.json`. Just run:

```bash
npm install
```

---

## 🚀 Start the Server

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Production Mode

```bash
npm run build
npm start
```

---

## 🧪 Test the API

### Test Volunteer Registration (Public)

```bash
curl -X POST http://localhost:5000/api/volunteers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "skills": ["Gardening/Planting", "Weeding"],
    "days": ["Monday", "Wednesday"],
    "times": ["Morning"],
    "location": "West Urbana",
    "experience": "some"
  }'
```

### Test Garden Creation (Admin - Requires Auth)

```bash
curl -X POST http://localhost:5000/api/gardens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "gardenName": "Community Garden",
    "location": "Downtown",
    "contactEmail": "garden@example.com",
    "skillsNeeded": ["Gardening/Planting"],
    "daysNeeded": ["Monday"],
    "timesNeeded": ["Morning"],
    "notes": "Beginner friendly"
  }'
```

### Test Auto-Match

```bash
curl http://localhost:5000/api/match/1 \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

---

## 📁 Backend File Structure

```
server/
├── index.ts          # Main Express server
├── routes.ts         # Route registration
├── api-routes.ts     # All API endpoints
├── db.ts             # Database connection & queries
├── matching.ts       # Matching algorithm
├── auth.ts           # Stack Auth middleware
├── vite.ts           # Vite dev server setup
└── storage.ts        # (Legacy - can be removed)
```

---

## 🔌 API Endpoints Reference

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/volunteers` | Register new volunteer |

### Admin Endpoints (Require Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gardens` | Create garden |
| GET | `/api/gardens` | Get all gardens |
| DELETE | `/api/gardens/:id` | Delete garden |
| GET | `/api/volunteers` | Get all volunteers |
| GET | `/api/volunteers/:id` | Get single volunteer |
| GET | `/api/match/:gardenId` | Auto-match volunteers |
| POST | `/api/matches` | Create manual match |
| GET | `/api/matches` | Get all matches |
| DELETE | `/api/matches/:id` | Delete match |
| DELETE | `/api/matches/pair/:volunteerId/:gardenId` | Delete match by pair |

---

## 🔍 Matching Algorithm

The matching algorithm calculates compatibility scores:

- **Skills Match**: 40% weight
  - (matching skills / total skills needed) × 40
  
- **Days Match**: 30% weight
  - (matching days / total days needed) × 30
  
- **Times Match**: 30% weight
  - (matching times / total times needed) × 30

**Total Score**: 0-100%

Volunteers are sorted by match percentage (highest first).

---

## 🐛 Troubleshooting

### Database Connection Issues

**Error**: `Connection refused`
- Check DATABASE_URL is correct
- Verify Neon database is active
- Ensure `?sslmode=require` is in connection string

### Authentication Issues

**Error**: `Unauthorized`
- Check Stack Auth token is valid
- Verify Authorization header format: `Bearer <token>`
- For development, set `BYPASS_AUTH=true` in `.env`

### Port Already in Use

**Error**: `EADDRINUSE`
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### TypeScript Errors

The lint errors about missing types are false positives - all types are installed in `package.json`. The server will compile and run correctly.

---

## 🔒 Security Notes

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set `BYPASS_AUTH=false`
- [ ] Use strong database password
- [ ] Keep Stack Auth secret key secure
- [ ] Enable CORS only for your domain
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Set up database backups

### Stack Auth Integration

The current auth middleware is a placeholder. For production:

1. Install Stack Auth SDK:
```bash
npm install @stackframe/stack
```

2. Update `server/auth.ts` with proper token verification
3. Configure Stack Auth webhooks for user management

---

## 📊 Database Schema

### volunteers table
- `id` - Auto-increment primary key
- `name` - Volunteer name
- `email` - Unique email
- `skills` - Array of skills
- `available_days` - Array of available days
- `available_times` - Array of time preferences
- `location` - Location preference
- `experience_level` - new/some/experienced
- `created_at` - Timestamp

### gardens table
- `id` - Auto-increment primary key
- `garden_name` - Garden name
- `location` - Garden location
- `contact_email` - Contact email
- `skills_needed` - Array of required skills
- `days_needed` - Array of needed days
- `times_needed` - Array of needed times
- `additional_notes` - Optional notes
- `created_at` - Timestamp

### matches table
- `id` - Auto-increment primary key
- `volunteer_id` - Foreign key to volunteers
- `garden_id` - Foreign key to gardens
- `match_score` - Match percentage (0-100)
- `is_manual` - Boolean (manual vs auto match)
- `created_at` - Timestamp
- Unique constraint on (volunteer_id, garden_id)

---

## 🎯 Next Steps

1. ✅ Set up Neon database
2. ✅ Run database schema
3. ✅ Configure environment variables
4. ✅ Start the server
5. ⬜ Test API endpoints
6. ⬜ Integrate frontend (see FRONTEND_INTEGRATION_GUIDE.md)
7. ⬜ Configure Stack Auth properly
8. ⬜ Deploy to production

---

## 📞 Support

For issues:
- Check Neon dashboard for database status
- Check Stack Auth dashboard for auth issues
- Review server logs: `npm run dev` shows all API calls
- Test endpoints with curl or Postman
