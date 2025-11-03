import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

console.log('[DB] Connecting to database...');
console.log('[DB] DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');

// Create a SQL query function
export const sql = neon(process.env.DATABASE_URL);

console.log('[DB] Database connection established');

// Type definitions for the new schema
export interface TimeSlot {
  day: string;
  time: string;
}

export interface MatchDetails {
  skills_match: {
    score: number;
    matched: string[];
    missing: string[];
  };
  schedule_match: {
    score: number;
    matched: TimeSlot[];
    missing: TimeSlot[];
  };
  overall_score: number;
}

// Database helper functions with new schema support
export const db = {
  // ============================================
  // VOLUNTEER OPERATIONS
  // ============================================

  async createVolunteer(data: {
    name: string;
    email: string;
    skills: string[];
    availability: TimeSlot[]; // NEW: Grid-based availability
    location: string;
    experience: string;
  }) {
    console.log('[DB] createVolunteer called with data:', data);
    try {
      const result = await sql`
        INSERT INTO volunteers (name, email, skills, availability, location, experience_level)
        VALUES (
          ${data.name}, 
          ${data.email}, 
          ${data.skills}, 
          ${JSON.stringify(data.availability)}::jsonb,
          ${data.location}, 
          ${data.experience}
        )
        RETURNING *
      `;
      console.log('[DB] createVolunteer result:', result[0]);
      return result[0];
    } catch (error) {
      console.error('[DB] createVolunteer error:', error);
      throw error;
    }
  },

  async getAllVolunteers() {
    console.log('[DB] getAllVolunteers called');
    try {
      const result = await sql`
        SELECT * FROM volunteers ORDER BY created_at DESC
      `;
      console.log('[DB] getAllVolunteers found', result.length, 'volunteers');
      if (result.length > 0) {
        console.log('[DB] First volunteer sample:', {
          id: result[0].id,
          name: result[0].name,
          availability: result[0].availability,
          availability_type: typeof result[0].availability,
          availability_isArray: Array.isArray(result[0].availability)
        });
      }
      return result;
    } catch (error) {
      console.error('[DB] getAllVolunteers error:', error);
      throw error;
    }
  },

  async getVolunteerById(id: number) {
    const result = await sql`
      SELECT * FROM volunteers WHERE id = ${id}
    `;
    return result[0];
  },

  async deleteVolunteer(id: number) {
    await sql`
      DELETE FROM volunteers WHERE id = ${id}
    `;
  },

  // ============================================
  // GARDEN OPERATIONS
  // ============================================

  async createGarden(data: {
    gardenName: string;
    location: string;
    contactEmail: string;
    skillsNeeded: string[];
    needsSchedule: TimeSlot[]; // NEW: Grid-based schedule
    notes?: string;
  }) {
    console.log('[DB] createGarden called with data:', data);
    try {
      const result = await sql`
        INSERT INTO gardens (garden_name, location, contact_email, skills_needed, needs_schedule, additional_notes)
        VALUES (
          ${data.gardenName}, 
          ${data.location}, 
          ${data.contactEmail}, 
          ${data.skillsNeeded}, 
          ${JSON.stringify(data.needsSchedule)}::jsonb,
          ${data.notes || null}
        )
        RETURNING *
      `;
      console.log('[DB] createGarden result:', result[0]);
      return result[0];
    } catch (error) {
      console.error('[DB] createGarden error:', error);
      throw error;
    }
  },

  async getAllGardens() {
    console.log('[DB] getAllGardens called');
    try {
      const result = await sql`
        SELECT * FROM gardens ORDER BY created_at DESC
      `;
      console.log('[DB] getAllGardens found', result.length, 'gardens');
      if (result.length > 0) {
        console.log('[DB] First garden sample:', {
          id: result[0].id,
          garden_name: result[0].garden_name,
          needs_schedule: result[0].needs_schedule,
          needs_schedule_type: typeof result[0].needs_schedule,
          needs_schedule_isArray: Array.isArray(result[0].needs_schedule)
        });
      }
      return result;
    } catch (error) {
      console.error('[DB] getAllGardens error:', error);
      throw error;
    }
  },

  async getGardenById(id: number) {
    const result = await sql`
      SELECT * FROM gardens WHERE id = ${id}
    `;
    return result[0];
  },

  async deleteGarden(id: number) {
    await sql`
      DELETE FROM gardens WHERE id = ${id}
    `;
  },

  // ============================================
  // MATCH OPERATIONS
  // ============================================

  async createMatch(data: {
    volunteerId: number;
    gardenId: number;
    matchType: 'auto' | 'manual';
    matchScore?: number;
    matchDetails?: MatchDetails;
    notes?: string;
    status?: 'pending' | 'accepted' | 'declined' | 'cancelled';
  }) {
    console.log('[DB] createMatch called with data:', data);
    try {
      const result = await sql`
        INSERT INTO matches (
          volunteer_id, 
          garden_id, 
          match_type, 
          match_score, 
          match_details,
          notes,
          status
        )
        VALUES (
          ${data.volunteerId}, 
          ${data.gardenId}, 
          ${data.matchType}, 
          ${data.matchScore || null},
          ${data.matchDetails ? JSON.stringify(data.matchDetails) : null}::jsonb,
          ${data.notes || null},
          ${data.status || 'pending'}
        )
        RETURNING *
      `;
      console.log('[DB] createMatch result:', result[0]);
      return result[0];
    } catch (error) {
      console.error('[DB] createMatch error:', error);
      throw error;
    }
  },

  async getAllMatches() {
    console.log('[DB] getAllMatches called');
    try {
      const result = await sql`
        SELECT 
          m.*,
          v.name as volunteer_name,
          v.email as volunteer_email,
          v.skills as volunteer_skills,
          v.availability as volunteer_availability,
          g.garden_name,
          g.location as garden_location,
          g.contact_email as garden_contact_email,
          g.skills_needed as garden_skills_needed,
          g.needs_schedule as garden_needs_schedule
        FROM matches m
        JOIN volunteers v ON m.volunteer_id = v.id
        JOIN gardens g ON m.garden_id = g.id
        ORDER BY m.created_at DESC
      `;
      console.log('[DB] getAllMatches found', result.length, 'matches');
      return result;
    } catch (error) {
      console.error('[DB] getAllMatches error:', error);
      throw error;
    }
  },

  async getMatchById(id: number) {
    const result = await sql`
      SELECT 
        m.*,
        v.name as volunteer_name,
        v.email as volunteer_email,
        g.garden_name,
        g.contact_email as garden_contact_email
      FROM matches m
      JOIN volunteers v ON m.volunteer_id = v.id
      JOIN gardens g ON m.garden_id = g.id
      WHERE m.id = ${id}
    `;
    return result[0];
  },

  async updateMatchStatus(id: number, status: 'pending' | 'accepted' | 'declined' | 'cancelled', notes?: string) {
    console.log('[DB] updateMatchStatus called:', { id, status, notes });
    const result = await sql`
      UPDATE matches 
      SET status = ${status}, 
          notes = ${notes || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0];
  },

  async markEmailSent(id: number) {
    console.log('[DB] markEmailSent called for match:', id);
    const result = await sql`
      UPDATE matches 
      SET email_sent = TRUE,
          email_sent_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0];
  },

  async deleteMatch(id: number) {
    await sql`
      DELETE FROM matches WHERE id = ${id}
    `;
  },

  async deleteMatchByPair(volunteerId: number, gardenId: number) {
    console.log('[DB] deleteMatchByPair called:', { volunteerId, gardenId });
    await sql`
      DELETE FROM matches 
      WHERE volunteer_id = ${volunteerId} AND garden_id = ${gardenId}
    `;
  },

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  async checkTablesExist() {
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    return result.map(r => r.table_name);
  },

  async getMatchesForVolunteer(volunteerId: number) {
    const result = await sql`
      SELECT m.*, g.garden_name, g.location as garden_location
      FROM matches m
      JOIN gardens g ON m.garden_id = g.id
      WHERE m.volunteer_id = ${volunteerId}
      ORDER BY m.created_at DESC
    `;
    return result;
  },

  async getMatchesForGarden(gardenId: number) {
    const result = await sql`
      SELECT m.*, v.name as volunteer_name, v.email as volunteer_email
      FROM matches m
      JOIN volunteers v ON m.volunteer_id = v.id
      WHERE m.garden_id = ${gardenId}
      ORDER BY m.created_at DESC
    `;
    return result;
  },
};
