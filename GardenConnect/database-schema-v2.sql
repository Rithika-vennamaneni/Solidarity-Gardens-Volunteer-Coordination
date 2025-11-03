-- Updated Database Schema for Solidarity Gardens Volunteer Matching
-- Version 2.0 - Grid-based availability system

-- Drop existing tables if you want to start fresh (CAREFUL - this deletes data!)
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS gardens CASCADE;
DROP TABLE IF EXISTS volunteers CASCADE;

-- VOLUNTEERS TABLE (Updated)
CREATE TABLE IF NOT EXISTS volunteers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  skills TEXT[] NOT NULL,
  -- NEW: Combined availability as JSON array of {day, time} objects
  availability JSONB NOT NULL DEFAULT '[]'::jsonb,
  location VARCHAR(255) NOT NULL,
  experience_level VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GARDENS TABLE (Updated)
CREATE TABLE IF NOT EXISTS gardens (
  id SERIAL PRIMARY KEY,
  garden_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  skills_needed TEXT[] NOT NULL,
  -- NEW: Combined schedule needs as JSON array of {day, time} objects
  needs_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  additional_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MATCHES TABLE (Updated)
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  volunteer_id INTEGER NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  garden_id INTEGER NOT NULL REFERENCES gardens(id) ON DELETE CASCADE,
  match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('auto', 'manual')),
  match_score DECIMAL(5,2),
  -- NEW: Match status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  -- NEW: Admin notes about the match
  notes TEXT,
  -- NEW: Email notification tracking
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP,
  -- NEW: Detailed match breakdown (JSON)
  match_details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(volunteer_id, garden_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers(email);
CREATE INDEX IF NOT EXISTS idx_volunteers_availability ON volunteers USING GIN(availability);
CREATE INDEX IF NOT EXISTS idx_gardens_schedule ON gardens USING GIN(needs_schedule);
CREATE INDEX IF NOT EXISTS idx_matches_volunteer ON matches(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_matches_garden ON matches(garden_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- Migration script to convert existing data (if you have data)
-- This converts the old format to the new format

-- Update volunteers: Convert separate days/times to combined availability
-- Uncomment and run this if you have existing data:
/*
UPDATE volunteers
SET availability = (
  SELECT jsonb_agg(
    jsonb_build_object('day', day, 'time', time)
  )
  FROM (
    SELECT unnest(available_days) as day, unnest(available_times) as time
  ) AS combinations
)
WHERE availability = '[]'::jsonb;

-- After migration, you can drop old columns:
-- ALTER TABLE volunteers DROP COLUMN IF EXISTS available_days;
-- ALTER TABLE volunteers DROP COLUMN IF EXISTS available_times;
*/

-- Update gardens: Convert separate days/times to combined schedule
-- Uncomment and run this if you have existing data:
/*
UPDATE gardens
SET needs_schedule = (
  SELECT jsonb_agg(
    jsonb_build_object('day', day, 'time', time)
  )
  FROM (
    SELECT unnest(days_needed) as day, unnest(times_needed) as time
  ) AS combinations
)
WHERE needs_schedule = '[]'::jsonb;

-- After migration, you can drop old columns:
-- ALTER TABLE gardens DROP COLUMN IF EXISTS days_needed;
-- ALTER TABLE gardens DROP COLUMN IF EXISTS times_needed;
*/

-- Sample data format for new schema:

-- Example volunteer with grid-based availability:
/*
INSERT INTO volunteers (name, email, skills, availability, location, experience_level)
VALUES (
  'John Doe',
  'john@example.com',
  ARRAY['Gardening', 'Weeding'],
  '[
    {"day": "Monday", "time": "Morning"},
    {"day": "Monday", "time": "Afternoon"},
    {"day": "Wednesday", "time": "Morning"},
    {"day": "Friday", "time": "Evening"}
  ]'::jsonb,
  'Downtown',
  'Intermediate'
);
*/

-- Example garden with grid-based schedule needs:
/*
INSERT INTO gardens (garden_name, location, contact_email, skills_needed, needs_schedule)
VALUES (
  'Community Garden',
  'Main Street',
  'garden@example.com',
  ARRAY['Gardening', 'Weeding', 'Tool Maintenance'],
  '[
    {"day": "Monday", "time": "Morning"},
    {"day": "Wednesday", "time": "Morning"},
    {"day": "Friday", "time": "Afternoon"}
  ]'::jsonb
);
*/

-- Example match with new fields:
/*
INSERT INTO matches (volunteer_id, garden_id, match_type, match_score, status, notes, match_details)
VALUES (
  1,
  1,
  'manual',
  85.50,
  'pending',
  'Good fit for morning shifts',
  '{
    "skills_match": {
      "score": 66.67,
      "matched": ["Gardening", "Weeding"],
      "missing": ["Tool Maintenance"]
    },
    "schedule_match": {
      "score": 100.0,
      "matched": [
        {"day": "Monday", "time": "Morning"},
        {"day": "Wednesday", "time": "Morning"}
      ],
      "missing": [
        {"day": "Friday", "time": "Afternoon"}
      ]
    }
  }'::jsonb
);
*/

-- Helpful queries for the new schema:

-- Get all volunteers available on Monday Morning:
-- SELECT * FROM volunteers WHERE availability @> '[{"day": "Monday", "time": "Morning"}]'::jsonb;

-- Get all gardens needing help on Wednesday:
-- SELECT * FROM gardens WHERE needs_schedule @> '[{"day": "Wednesday"}]'::jsonb;

-- Get matches with their details:
-- SELECT m.*, v.name as volunteer_name, g.garden_name, m.match_details
-- FROM matches m
-- JOIN volunteers v ON m.volunteer_id = v.id
-- JOIN gardens g ON m.garden_id = g.id
-- ORDER BY m.created_at DESC;
