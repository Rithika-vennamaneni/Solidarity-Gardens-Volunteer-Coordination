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

// Database helper functions
export const db = {
  // Volunteer operations
  async createVolunteer(data: {
    name: string;
    email: string;
    skills: string[];
    days: string[];
    times: string[];
    location: string;
    experience: string;
  }) {
    console.log('[DB] createVolunteer called with data:', data);
    try {
      const result = await sql`
        INSERT INTO volunteers (name, email, skills, available_days, available_times, location, experience_level)
        VALUES (${data.name}, ${data.email}, ${data.skills}, ${data.days}, ${data.times}, ${data.location}, ${data.experience})
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

  // Garden operations
  async createGarden(data: {
    gardenName: string;
    location: string;
    contactEmail: string;
    skillsNeeded: string[];
    daysNeeded: string[];
    timesNeeded: string[];
    notes?: string;
  }) {
    const result = await sql`
      INSERT INTO gardens (garden_name, location, contact_email, skills_needed, days_needed, times_needed, additional_notes)
      VALUES (${data.gardenName}, ${data.location}, ${data.contactEmail}, ${data.skillsNeeded}, ${data.daysNeeded}, ${data.timesNeeded}, ${data.notes || null})
      RETURNING *
    `;
    return result[0];
  },

  async getAllGardens() {
    return await sql`
      SELECT * FROM gardens ORDER BY created_at DESC
    `;
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

  // Match operations
  async createMatch(volunteerId: number, gardenId: number, matchScore: number, isManual: boolean = false) {
    const result = await sql`
      INSERT INTO matches (volunteer_id, garden_id, match_score, is_manual)
      VALUES (${volunteerId}, ${gardenId}, ${matchScore}, ${isManual})
      ON CONFLICT (volunteer_id, garden_id) DO UPDATE
      SET match_score = ${matchScore}, is_manual = ${isManual}
      RETURNING *
    `;
    return result[0];
  },

  async getAllMatches() {
    return await sql`
      SELECT 
        m.*,
        v.name as volunteer_name,
        v.email as volunteer_email,
        g.garden_name,
        g.location as garden_location
      FROM matches m
      JOIN volunteers v ON m.volunteer_id = v.id
      JOIN gardens g ON m.garden_id = g.id
      ORDER BY m.created_at DESC
    `;
  },

  async getMatchesByGarden(gardenId: number) {
    return await sql`
      SELECT 
        m.*,
        v.*
      FROM matches m
      JOIN volunteers v ON m.volunteer_id = v.id
      WHERE m.garden_id = ${gardenId}
      ORDER BY m.match_score DESC
    `;
  },

  async getMatchesByVolunteer(volunteerId: number) {
    return await sql`
      SELECT 
        m.*,
        g.*
      FROM matches m
      JOIN gardens g ON m.garden_id = g.id
      WHERE m.volunteer_id = ${volunteerId}
      ORDER BY m.created_at DESC
    `;
  },

  async deleteMatch(id: number) {
    await sql`
      DELETE FROM matches WHERE id = ${id}
    `;
  },

  async deleteMatchByPair(volunteerId: number, gardenId: number) {
    await sql`
      DELETE FROM matches WHERE volunteer_id = ${volunteerId} AND garden_id = ${gardenId}
    `;
  }
};
