# Implementation Guide - Volunteer Matching System V2.0

## 🎯 Overview

This guide walks you through implementing the major improvements to the volunteer matching system. The changes are substantial and require careful step-by-step implementation.

## ⚠️ IMPORTANT: Database Migration Required

Before implementing the UI changes, you MUST update your database schema.

### Step 1: Backup Your Data (CRITICAL!)

```sql
-- Export existing data
COPY volunteers TO '/tmp/volunteers_backup.csv' CSV HEADER;
COPY gardens TO '/tmp/gardens_backup.csv' CSV HEADER;
COPY matches TO '/tmp/matches_backup.csv' CSV HEADER;
```

### Step 2: Run the New Schema

1. Go to Neon Console: https://console.neon.tech/
2. Open SQL Editor
3. Copy and paste contents of `database-schema-v2.sql`
4. Run the script

This will:
- Add new columns: `availability` (JSONB) to volunteers
- Add new columns: `needs_schedule` (JSONB) to gardens  
- Add new columns to matches: `status`, `notes`, `email_sent`, `email_sent_at`, `match_details`
- Create indexes for better performance

### Step 3: Migrate Existing Data (if you have data)

If you have existing volunteers/gardens, run this migration:

```sql
-- Convert volunteers from old format to new format
-- This creates all combinations of days × times
UPDATE volunteers
SET availability = (
  SELECT jsonb_agg(
    jsonb_build_object('day', d.day, 'time', t.time)
  )
  FROM unnest(available_days) AS d(day)
  CROSS JOIN unnest(available_times) AS t(time)
)
WHERE availability = '[]'::jsonb OR availability IS NULL;

-- Convert gardens from old format to new format
UPDATE gardens
SET needs_schedule = (
  SELECT jsonb_agg(
    jsonb_build_object('day', d.day, 'time', t.time)
  )
  FROM unnest(days_needed) AS d(day)
  CROSS JOIN unnest(times_needed) AS t(time)
)
WHERE needs_schedule = '[]'::jsonb OR needs_schedule IS NULL;
```

**Note**: This migration creates ALL combinations. For example, if a volunteer selected [Monday, Tuesday] and [Morning, Afternoon], they'll get:
- Monday Morning
- Monday Afternoon
- Tuesday Morning
- Tuesday Afternoon

This is a conservative migration that preserves maximum availability. Users can refine their selections later.

## 📁 Files Created

### Backend Files:
1. **`database-schema-v2.sql`** - New database schema with JSONB columns
2. **`server/db-v2.ts`** - Updated database functions for new schema
3. **`server/matching-v2.ts`** - Enhanced matching algorithm with detailed breakdown

### Frontend Files:
4. **`client/src/components/AvailabilityGrid.tsx`** - Grid component for day×time selection

### Documentation:
5. **`IMPLEMENTATION_GUIDE_V2.md`** - This file

## 🔄 Implementation Steps

### Phase 1: Backend Setup (Do This First!)

#### 1.1: Update Database Schema
```bash
# Run database-schema-v2.sql in Neon Console
# This adds new columns and indexes
```

#### 1.2: Switch to New Database Functions
Replace imports in your API routes:

```typescript
// OLD:
import { db } from './db';

// NEW:
import { db } from './db-v2';
```

#### 1.3: Update API Routes
The API routes need to handle the new data format:

**For POST /api/volunteers:**
```typescript
// OLD format:
{ days: string[], times: string[] }

// NEW format:
{ availability: TimeSlot[] }
// where TimeSlot = { day: string, time: string }
```

**For POST /api/gardens:**
```typescript
// OLD format:
{ daysNeeded: string[], timesNeeded: string[] }

// NEW format:
{ needsSchedule: TimeSlot[] }
```

### Phase 2: Update Volunteer Form

#### 2.1: Import AvailabilityGrid Component
```typescript
import AvailabilityGrid, { TimeSlot } from '@/components/AvailabilityGrid';
```

#### 2.2: Replace Day/Time Selectors
Remove the old checkbox groups for days and times, replace with:

```typescript
const [availability, setAvailability] = useState<TimeSlot[]>([]);

<AvailabilityGrid
  value={availability}
  onChange={setAvailability}
  label="When are you available?"
  description="Select the specific day and time combinations when you can volunteer"
/>
```

#### 2.3: Update Form Submission
```typescript
// OLD:
const formData = {
  days: selectedDays,
  times: selectedTimes,
  // ...
};

// NEW:
const formData = {
  availability: availability, // Array of {day, time} objects
  // ...
};
```

### Phase 3: Update Garden Form

Same process as volunteer form:

```typescript
const [needsSchedule, setNeedsSchedule] = useState<TimeSlot[]>([]);

<AvailabilityGrid
  value={needsSchedule}
  onChange={setNeedsSchedule}
  label="When do you need volunteers?"
  description="Select the specific day and time combinations when you need help"
/>
```

### Phase 4: Update Auto-Match Tab

This requires significant changes to show detailed match breakdown.

#### 4.1: Update Match Display Component

Create a new component `MatchDetailsCard.tsx`:

```typescript
interface MatchDetailsCardProps {
  volunteer: VolunteerMatch;
  onSelect: () => void;
}

function MatchDetailsCard({ volunteer, onSelect }: MatchDetailsCardProps) {
  const { match_details } = volunteer;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{volunteer.volunteer_name}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={getScoreVariant(match_details.overall_score)}>
            {match_details.overall_score}% Match
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Skills Match Section */}
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Skills Match: {match_details.skills_match.percentage}</h4>
          <Progress value={parseFloat(match_details.skills_match.percentage)} />
          <div className="mt-2 text-sm">
            {match_details.skills_match.matched.length > 0 && (
              <p className="text-green-600">
                ✓ Matches: {match_details.skills_match.matched.join(', ')}
              </p>
            )}
            {match_details.skills_match.missing.length > 0 && (
              <p className="text-orange-600">
                ⚠ Missing: {match_details.skills_match.missing.join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Schedule Match Section */}
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Schedule Match: {match_details.schedule_match.percentage}</h4>
          <Progress value={parseFloat(match_details.schedule_match.percentage)} />
          <div className="mt-2 text-sm">
            {match_details.schedule_match.matched.length > 0 && (
              <p className="text-green-600">
                ✓ Available: {formatTimeSlots(match_details.schedule_match.matched)}
              </p>
            )}
            {match_details.schedule_match.missing.length > 0 && (
              <p className="text-orange-600">
                ⚠ Not available: {formatTimeSlots(match_details.schedule_match.missing)}
              </p>
            )}
          </div>
        </div>

        <Button onClick={onSelect} className="w-full">
          Select This Volunteer
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### 4.2: Add Match Confirmation Dialog

When admin clicks "Select", show a dialog to:
- Review the match details
- Adjust specific time slots for this match
- Add notes
- Confirm or cancel

### Phase 5: Fix Manual Match Tab

Complete rewrite needed for two-column layout.

#### 5.1: New Layout Structure

```typescript
<div className="grid grid-cols-2 gap-4">
  {/* Left Column: Volunteers */}
  <Card>
    <CardHeader>
      <CardTitle>Volunteers</CardTitle>
    </CardHeader>
    <CardContent>
      {volunteers.map(volunteer => (
        <div
          key={volunteer.id}
          className={`p-3 border rounded cursor-pointer ${
            selectedVolunteer?.id === volunteer.id ? 'border-primary bg-primary/10' : ''
          }`}
          onClick={() => setSelectedVolunteer(volunteer)}
        >
          <h4 className="font-semibold">{volunteer.name}</h4>
          <p className="text-sm text-muted-foreground">{volunteer.email}</p>
          <div className="mt-2">
            <p className="text-xs font-medium">Skills:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {volunteer.skills.map(skill => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs font-medium">Available:</p>
            <p className="text-xs text-muted-foreground">
              {formatTimeSlots(volunteer.availability)}
            </p>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>

  {/* Right Column: Gardens */}
  <Card>
    <CardHeader>
      <CardTitle>Gardens</CardTitle>
    </CardHeader>
    <CardContent>
      {gardens.map(garden => (
        <div
          key={garden.id}
          className={`p-3 border rounded cursor-pointer ${
            selectedGarden?.id === garden.id ? 'border-primary bg-primary/10' : ''
          }`}
          onClick={() => setSelectedGarden(garden)}
        >
          <h4 className="font-semibold">{garden.garden_name}</h4>
          <p className="text-sm text-muted-foreground">{garden.location}</p>
          <div className="mt-2">
            <p className="text-xs font-medium">Needs:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {garden.skills_needed.map(skill => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs font-medium">Schedule Needed:</p>
            <p className="text-xs text-muted-foreground">
              {formatTimeSlots(garden.needs_schedule)}
            </p>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
</div>

{/* Match Button (only show when both selected) */}
{selectedVolunteer && selectedGarden && (
  <div className="mt-4 p-4 border rounded bg-muted">
    <h3 className="font-semibold mb-2">Create Match</h3>
    <p className="text-sm mb-4">
      Match {selectedVolunteer.name} with {selectedGarden.garden_name}?
    </p>
    <div className="flex gap-2">
      <Button onClick={handleCreateMatch}>Confirm Match</Button>
      <Button variant="outline" onClick={handleClearSelection}>Cancel</Button>
    </div>
  </div>
)}
```

### Phase 6: Create Current Matches View

Add a new tab or section for match management.

#### 6.1: Matches Table/Cards

```typescript
<div className="space-y-4">
  {matches.map(match => (
    <Card key={match.id}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold">{match.volunteer_name}</h4>
              <ArrowRight className="h-4 w-4" />
              <h4 className="font-semibold">{match.garden_name}</h4>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Score: {match.match_score}%</span>
              <span>Status: <Badge>{match.status}</Badge></span>
              <span>Created: {formatDate(match.created_at)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleSendEmail(match)}>
              <Mail className="h-4 w-4 mr-1" />
              Send Email
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleViewDetails(match)}>
              View Details
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleRemoveMatch(match.id)}>
              Remove
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

### Phase 7: Email Notification System

#### 7.1: Generate mailto: Link

```typescript
function generateMatchEmail(match: Match): string {
  const subject = encodeURIComponent(`Volunteer Match: ${match.garden_name}`);
  const body = encodeURIComponent(`
Hello ${match.volunteer_name},

Great news! We've matched you with ${match.garden_name}!

Garden Details:
- Location: ${match.garden_location}
- Contact: ${match.garden_contact_email}

Your Matched Schedule:
${formatMatchedSlots(match.match_details.schedule_match.matched)}

Skills Needed:
${match.garden_skills_needed.join(', ')}

Please confirm your availability by replying to this email.

Thank you for volunteering!

Best regards,
Solidarity Gardens Team
  `);

  return `mailto:${match.volunteer_email}?subject=${subject}&body=${body}`;
}

function handleSendEmail(match: Match) {
  const mailtoLink = generateMatchEmail(match);
  window.open(mailtoLink, '_blank');
  
  // Mark email as sent in database
  markEmailSent(match.id);
}
```

## 🧪 Testing Checklist

### Database Testing:
- [ ] Run `database-schema-v2.sql` successfully
- [ ] Verify new columns exist
- [ ] Run migration script if you have existing data
- [ ] Test inserting a volunteer with availability grid format
- [ ] Test inserting a garden with needs_schedule format

### Volunteer Form Testing:
- [ ] Availability grid displays correctly
- [ ] Can select/deselect individual time slots
- [ ] "Toggle All" buttons work for rows and columns
- [ ] Selected slots show in summary
- [ ] Form submits with correct JSON format
- [ ] Data saves to database correctly

### Garden Form Testing:
- [ ] Same tests as volunteer form
- [ ] Needs schedule grid works correctly

### Auto-Match Testing:
- [ ] Select a garden
- [ ] See detailed match breakdown for each volunteer
- [ ] Skills match percentage is correct
- [ ] Schedule match percentage is correct
- [ ] Overall score is calculated correctly
- [ ] Can select a volunteer
- [ ] Match confirmation dialog appears
- [ ] Match is created in database

### Manual Match Testing:
- [ ] Two-column layout displays
- [ ] Can select a volunteer (left column highlights)
- [ ] Can select a garden (right column highlights)
- [ ] Match button appears when both selected
- [ ] Confirmation works
- [ ] Match is created
- [ ] Selection clears after match

### Current Matches Testing:
- [ ] All matches display
- [ ] Can filter by status
- [ ] "Send Email" opens mailto link
- [ ] Email is marked as sent
- [ ] "View Details" shows full breakdown
- [ ] "Remove Match" deletes the match

## 🚨 Common Issues

### Issue: "Column does not exist"
**Solution**: Run the database schema update script

### Issue: "Cannot read property 'day' of undefined"
**Solution**: Make sure you're using the new TimeSlot[] format, not separate arrays

### Issue: Match scores are 0%
**Solution**: Check that availability/needs_schedule are properly formatted as JSONB arrays

### Issue: Grid component not displaying
**Solution**: Make sure Checkbox component is imported from shadcn/ui

## 📊 Data Format Reference

### Old Format (Don't use):
```json
{
  "days": ["Monday", "Tuesday"],
  "times": ["Morning", "Afternoon"]
}
```

### New Format (Use this):
```json
{
  "availability": [
    { "day": "Monday", "time": "Morning" },
    { "day": "Monday", "time": "Afternoon" },
    { "day": "Tuesday", "time": "Morning" }
  ]
}
```

## 🎯 Next Steps After Implementation

1. Test thoroughly with real data
2. Remove debug console.log statements
3. Add loading states for better UX
4. Add error boundaries
5. Implement actual email sending (not just mailto)
6. Add volunteer response tracking (Accept/Decline)
7. Add analytics/reporting

## 📞 Support

If you encounter issues:
1. Check database schema is updated
2. Verify data format matches examples
3. Check browser console for errors
4. Check server terminal for backend errors
5. Review this guide step-by-step

Good luck with the implementation! 🚀
