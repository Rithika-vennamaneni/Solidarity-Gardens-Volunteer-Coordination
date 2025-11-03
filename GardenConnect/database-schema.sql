-- Solidarity Gardens Database Schema for Neon PostgreSQL
-- Run this SQL in your Neon console to create the required tables

-- Create volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  skills TEXT[] NOT NULL,
  available_days TEXT[] NOT NULL,
  available_times TEXT[] NOT NULL,
  location TEXT NOT NULL,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('new', 'some', 'experienced')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create gardens table
CREATE TABLE IF NOT EXISTS gardens (
  id SERIAL PRIMARY KEY,
  garden_name TEXT NOT NULL,
  location TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  skills_needed TEXT[] NOT NULL,
  days_needed TEXT[] NOT NULL,
  times_needed TEXT[] NOT NULL,
  additional_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  volunteer_id INTEGER NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  garden_id INTEGER NOT NULL REFERENCES gardens(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL,
  is_manual BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(volunteer_id, garden_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers(email);
CREATE INDEX IF NOT EXISTS idx_volunteers_created_at ON volunteers(created_at);
CREATE INDEX IF NOT EXISTS idx_gardens_created_at ON gardens(created_at);
CREATE INDEX IF NOT EXISTS idx_matches_volunteer_id ON matches(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_matches_garden_id ON matches(garden_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON matches(match_score DESC);
