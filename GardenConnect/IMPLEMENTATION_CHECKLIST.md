# Implementation Checklist

Use this checklist to track your progress in setting up the Solidarity Gardens backend.

## 📋 Phase 1: Backend Setup (30 minutes)

### Database Setup
- [ ] Create Neon account at https://console.neon.tech/
- [ ] Create new Neon project
- [ ] Copy connection string
- [ ] Open Neon SQL Editor
- [ ] Copy contents of `database-schema.sql`
- [ ] Run SQL in Neon console
- [ ] Verify tables created:
  - [ ] `volunteers` table exists
  - [ ] `gardens` table exists
  - [ ] `matches` table exists
- [ ] Verify indexes created

### Environment Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Add `DATABASE_URL` from Neon
- [ ] Set `PORT=5000`
- [ ] Set `NODE_ENV=development`
- [ ] Set `BYPASS_AUTH=true` (for testing)
- [ ] Save `.env` file

### Server Startup
- [ ] Run `npm install` (if not already done)
- [ ] Run `npm run dev`
- [ ] Server starts without errors
- [ ] See "serving on port 5000" message
- [ ] No database connection errors

---

## 🧪 Phase 2: API Testing (15 minutes)

### Test Volunteer Endpoint (Public)
- [ ] Open terminal
- [ ] Run volunteer creation curl command (see QUICK_START.md)
- [ ] Receive 201 success response
- [ ] Check Neon dashboard - volunteer appears in database
- [ ] Try duplicate email - receive 409 error

### Test Garden Endpoint (Admin)
- [ ] Run garden creation curl command with auth header
- [ ] Receive 201 success response
- [ ] Check Neon dashboard - garden appears in database
- [ ] Run GET gardens endpoint
- [ ] Receive list of gardens

### Test Matching Endpoint
- [ ] Create at least 2 volunteers with different skills
- [ ] Create at least 1 garden
- [ ] Run auto-match endpoint with garden ID
- [ ] Receive match results with scores
- [ ] Verify scores are between 0-100
- [ ] Verify matches are sorted by score

### Test Manual Match
- [ ] Run POST /api/matches with volunteer and garden IDs
- [ ] Receive success response
- [ ] Check Neon dashboard - match appears in database
- [ ] Run GET /api/matches
- [ ] See the match in the list

---

## 🎨 Phase 3: Frontend Integration (60 minutes)

### Create API Helper File
- [ ] Create `client/src/lib/api.ts`
- [ ] Copy code from FRONTEND_INTEGRATION_GUIDE.md
- [ ] Update `getAuthToken()` function if using Stack Auth
- [ ] Save file

### Update VolunteerForm Component
- [ ] Open `client/src/components/VolunteerForm.tsx`
- [ ] Add import: `import { createVolunteer } from "@/lib/api"`
- [ ] Replace `onSubmit` function with API version
- [ ] Add error handling
- [ ] Test form submission
- [ ] Verify volunteer appears in database
- [ ] Verify redirect to confirmation page

### Update PostGardenTab Component
- [ ] Open `client/src/components/admin/PostGardenTab.tsx`
- [ ] Add imports for API functions and React Query
- [ ] Replace `useState` with `useQuery` for gardens
- [ ] Add `useMutation` for create and delete
- [ ] Update `onSubmit` to use mutation
- [ ] Update `handleDelete` to use mutation
- [ ] Test creating a garden
- [ ] Test deleting a garden
- [ ] Verify UI updates automatically

### Update ViewVolunteersTab Component
- [ ] Open `client/src/components/admin/ViewVolunteersTab.tsx`
- [ ] Add imports for API and React Query
- [ ] Replace `temporaryStorage.getVolunteers()` with `useQuery`
- [ ] Test volunteer list displays
- [ ] Test filters work correctly
- [ ] Verify real-time data from database

### Update AutoMatchTab Component
- [ ] Open `client/src/components/admin/AutoMatchTab.tsx`
- [ ] Add imports for API and React Query
- [ ] Replace garden fetching with `useQuery`
- [ ] Replace matching logic with API call
- [ ] Update data mapping for API response format
- [ ] Test selecting a garden
- [ ] Test clicking "Find Matches"
- [ ] Verify match scores display correctly
- [ ] Verify matches are sorted by score

### Update ManualMatchTab Component
- [ ] Open `client/src/components/admin/ManualMatchTab.tsx`
- [ ] Add imports for API and React Query
- [ ] Replace all `temporaryStorage` calls with API calls
- [ ] Add mutations for create and delete matches
- [ ] Update `isMatched` function to use API data
- [ ] Test creating a manual match
- [ ] Test removing a match
- [ ] Verify matches persist in database

### Setup React Query Provider
- [ ] Open `client/src/App.tsx`
- [ ] Import QueryClient and QueryClientProvider
- [ ] Create queryClient instance
- [ ] Wrap app with QueryClientProvider
- [ ] Test that all queries work

---

## 🔐 Phase 4: Authentication Setup (Optional - Later)

### Stack Auth Account
- [ ] Create account at https://app.stack-auth.com/
- [ ] Create new project
- [ ] Note Project ID
- [ ] Note Secret Key
- [ ] Configure allowed origins
- [ ] Configure redirect URIs

### Update Environment
- [ ] Add `STACK_PROJECT_ID` to `.env`
- [ ] Add `STACK_SECRET_KEY` to `.env`
- [ ] Set `BYPASS_AUTH=false`

### Update Auth Middleware
- [ ] Install Stack Auth SDK: `npm install @stackframe/stack`
- [ ] Open `server/auth.ts`
- [ ] Implement proper token verification
- [ ] Test with real Stack Auth tokens

### Update Frontend Auth
- [ ] Update `client/src/lib/api.ts`
- [ ] Implement proper token retrieval from Stack Auth
- [ ] Test login flow
- [ ] Test protected routes
- [ ] Test logout

---

## ✅ Phase 5: Final Testing (30 minutes)

### End-to-End Flow
- [ ] Open application in browser
- [ ] Fill out volunteer form
- [ ] Submit and verify confirmation
- [ ] Check database - volunteer exists
- [ ] Navigate to admin dashboard
- [ ] Post a new garden
- [ ] Verify garden appears in list
- [ ] Go to View Volunteers tab
- [ ] See the volunteer you created
- [ ] Go to Auto-Match tab
- [ ] Select the garden
- [ ] Click Find Matches
- [ ] See the volunteer with match score
- [ ] Go to Manual Match tab
- [ ] Create a manual match
- [ ] Verify match appears in list
- [ ] Delete the match
- [ ] Verify match is removed

### Error Handling
- [ ] Try submitting volunteer form with invalid email
- [ ] Try submitting volunteer form with duplicate email
- [ ] Try accessing admin routes without auth (if auth enabled)
- [ ] Try deleting non-existent garden
- [ ] Verify all errors are handled gracefully

### Performance
- [ ] Create 10+ volunteers
- [ ] Create 5+ gardens
- [ ] Test auto-match with many volunteers
- [ ] Verify response time is acceptable
- [ ] Check database query performance in Neon dashboard

---

## 🚀 Phase 6: Deployment Preparation

### Code Review
- [ ] Review all API endpoints
- [ ] Check error handling
- [ ] Verify input validation
- [ ] Review security middleware
- [ ] Check for hardcoded values

### Environment Setup
- [ ] Create production `.env` file
- [ ] Use production DATABASE_URL
- [ ] Set NODE_ENV=production
- [ ] Configure Stack Auth for production domain
- [ ] Set BYPASS_AUTH=false

### Build & Test
- [ ] Run `npm run build`
- [ ] Build completes without errors
- [ ] Run `npm start`
- [ ] Test production build locally
- [ ] Verify all features work

### Security Checklist
- [ ] HTTPS enabled
- [ ] CORS configured for production domain only
- [ ] Auth tokens verified properly
- [ ] SQL injection protection verified
- [ ] Input validation on all endpoints
- [ ] Rate limiting considered
- [ ] Error messages don't leak sensitive info

### Deployment
- [ ] Choose hosting platform (Vercel, Railway, etc.)
- [ ] Set environment variables
- [ ] Deploy application
- [ ] Test deployed application
- [ ] Monitor for errors
- [ ] Set up logging
- [ ] Configure database backups

---

## 📊 Progress Tracking

### Summary
- [ ] Phase 1: Backend Setup (✓ Complete / ⏳ In Progress / ☐ Not Started)
- [ ] Phase 2: API Testing (✓ Complete / ⏳ In Progress / ☐ Not Started)
- [ ] Phase 3: Frontend Integration (✓ Complete / ⏳ In Progress / ☐ Not Started)
- [ ] Phase 4: Authentication (✓ Complete / ⏳ In Progress / ☐ Not Started)
- [ ] Phase 5: Final Testing (✓ Complete / ⏳ In Progress / ☐ Not Started)
- [ ] Phase 6: Deployment (✓ Complete / ⏳ In Progress / ☐ Not Started)

### Time Estimates
- Phase 1: ~30 minutes
- Phase 2: ~15 minutes
- Phase 3: ~60 minutes
- Phase 4: ~45 minutes (optional)
- Phase 5: ~30 minutes
- Phase 6: ~60 minutes

**Total Time: ~3-4 hours**

---

## 🆘 Troubleshooting Reference

If you encounter issues, refer to:
- `BACKEND_SETUP.md` - Troubleshooting section
- `FRONTEND_INTEGRATION_GUIDE.md` - Integration issues
- `QUICK_START.md` - Common problems

---

## 🎉 Completion

When all checkboxes are marked:
- ✅ Your backend is fully functional
- ✅ Your frontend is connected to the database
- ✅ Your matching algorithm is working
- ✅ Your authentication is secure
- ✅ Your application is ready for users!

**Congratulations! Your Solidarity Gardens volunteer matching tool is complete!** 🌱
