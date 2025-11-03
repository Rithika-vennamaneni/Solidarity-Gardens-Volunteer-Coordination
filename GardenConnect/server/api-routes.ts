import { Router, Request, Response } from 'express';
import { db } from './db-v2'; // UPDATED: Using new V2 database functions
import { matchVolunteersToGarden } from './matching-v2'; // UPDATED: Using new V2 matching algorithm
import { requireAuth } from './auth';

const router = Router();

// ============================================
// VOLUNTEER ENDPOINTS (No Auth Required)
// ============================================

/**
 * POST /api/volunteers
 * Create a new volunteer sign-up
 */
router.post('/volunteers', async (req: Request, res: Response) => {
  try {
    console.log('[POST /api/volunteers] Received volunteer registration');
    console.log('[POST /api/volunteers] Request body:', req.body);
    
    const { name, email, skills, availability, location, experience } = req.body;

    // Validate required fields
    if (!name || !email || !skills || !availability || !location || !experience) {
      console.log('[POST /api/volunteers] Missing required fields');
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }

    console.log('[POST /api/volunteers] Creating volunteer in database...');
    
    // Create volunteer in database
    const volunteer = await db.createVolunteer({
      name,
      email,
      skills,
      availability, // NEW: Grid-based availability
      location,
      experience
    });

    console.log('[POST /api/volunteers] Volunteer created successfully:', volunteer);

    res.status(201).json({
      message: 'Volunteer registered successfully',
      volunteer
    });
  } catch (error: any) {
    console.error('[POST /api/volunteers] Error creating volunteer:', error);
    console.error('[POST /api/volunteers] Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Handle duplicate email error
    if (error.message?.includes('unique') || error.code === '23505') {
      return res.status(409).json({ 
        message: 'A volunteer with this email already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to register volunteer',
      error: error.message 
    });
  }
});

// ============================================
// GARDEN ENDPOINTS (Admin Auth Required)
// ============================================

/**
 * POST /api/gardens
 * Create a new garden opportunity
 */
router.post('/gardens', requireAuth, async (req: Request, res: Response) => {
  try {
    const { gardenName, location, contactEmail, skillsNeeded, needsSchedule, notes } = req.body;

    // Validate required fields
    if (!gardenName || !location || !contactEmail || !skillsNeeded || !needsSchedule) {
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }

    const garden = await db.createGarden({
      gardenName,
      location,
      contactEmail,
      skillsNeeded,
      needsSchedule, // NEW: Grid-based schedule
      notes
    });

    res.status(201).json({
      message: 'Garden created successfully',
      garden
    });
  } catch (error: any) {
    console.error('Error creating garden:', error);
    res.status(500).json({ 
      message: 'Failed to create garden',
      error: error.message 
    });
  }
});

/**
 * GET /api/gardens
 * Get all gardens
 */
router.get('/gardens', requireAuth, async (req: Request, res: Response) => {
  try {
    const gardens = await db.getAllGardens();
    res.json({ gardens });
  } catch (error: any) {
    console.error('Error fetching gardens:', error);
    res.status(500).json({ 
      message: 'Failed to fetch gardens',
      error: error.message 
    });
  }
});

/**
 * DELETE /api/gardens/:id
 * Delete a garden
 */
router.delete('/gardens/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const gardenId = parseInt(req.params.id);
    
    if (isNaN(gardenId)) {
      return res.status(400).json({ message: 'Invalid garden ID' });
    }

    await db.deleteGarden(gardenId);
    res.json({ message: 'Garden deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting garden:', error);
    res.status(500).json({ 
      message: 'Failed to delete garden',
      error: error.message 
    });
  }
});

// ============================================
// VOLUNTEER MANAGEMENT (Admin Auth Required)
// ============================================

/**
 * GET /api/volunteers
 * Get all volunteers
 */
router.get('/volunteers', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log('[GET /api/volunteers] Fetching all volunteers from database...');
    const volunteers = await db.getAllVolunteers();
    console.log('[GET /api/volunteers] Found', volunteers.length, 'volunteers');
    console.log('[GET /api/volunteers] Volunteers:', volunteers);
    res.json({ volunteers });
  } catch (error: any) {
    console.error('[GET /api/volunteers] Error fetching volunteers:', error);
    console.error('[GET /api/volunteers] Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Failed to fetch volunteers',
      error: error.message 
    });
  }
});

/**
 * GET /api/volunteers/:id
 * Get a single volunteer by ID
 */
router.get('/volunteers/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const volunteerId = parseInt(req.params.id);
    
    if (isNaN(volunteerId)) {
      return res.status(400).json({ message: 'Invalid volunteer ID' });
    }

    const volunteer = await db.getVolunteerById(volunteerId);
    
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    res.json({ volunteer });
  } catch (error: any) {
    console.error('Error fetching volunteer:', error);
    res.status(500).json({ 
      message: 'Failed to fetch volunteer',
      error: error.message 
    });
  }
});

// ============================================
// MATCHING ENDPOINTS (Admin Auth Required)
// ============================================

/**
 * GET /api/match/:gardenId
 * Auto-match volunteers to a specific garden
 */
router.get('/match/:gardenId', requireAuth, async (req: Request, res: Response) => {
  try {
    const gardenId = parseInt(req.params.gardenId);
    
    if (isNaN(gardenId)) {
      return res.status(400).json({ message: 'Invalid garden ID' });
    }

    // Get garden details
    const garden = await db.getGardenById(gardenId);
    if (!garden) {
      return res.status(404).json({ message: 'Garden not found' });
    }

    // Get all volunteers
    const volunteers = await db.getAllVolunteers();

    // Calculate matches using V2 algorithm
    const matches = matchVolunteersToGarden(volunteers as any, garden as any);

    res.json({
      garden,
      matches // V2 returns complete VolunteerMatch objects with match_details
    });
  } catch (error: any) {
    console.error('Error matching volunteers:', error);
    res.status(500).json({ 
      message: 'Failed to match volunteers',
      error: error.message 
    });
  }
});

/**
 * POST /api/matches
 * Create a manual match between volunteer and garden
 */
router.post('/matches', requireAuth, async (req: Request, res: Response) => {
  try {
    const { volunteerId, gardenId, matchScore } = req.body;

    if (!volunteerId || !gardenId) {
      return res.status(400).json({ 
        message: 'volunteerId and gardenId are required' 
      });
    }

    // Calculate match score and details
    const volunteer = await db.getVolunteerById(volunteerId);
    const garden = await db.getGardenById(gardenId);
    
    if (!volunteer || !garden) {
      return res.status(404).json({ 
        message: 'Volunteer or garden not found' 
      });
    }

    // Calculate match details using V2 algorithm
    const matchResults = matchVolunteersToGarden([volunteer] as any, garden as any);
    const matchDetails = matchResults[0]?.match_details;
    const score = matchDetails?.overall_score || matchScore || 0;

    // Create match with V2 format
    const match = await db.createMatch({
      volunteerId,
      gardenId,
      matchType: 'manual',
      matchScore: score,
      matchDetails,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Match created successfully',
      match
    });
  } catch (error: any) {
    console.error('Error creating match:', error);
    res.status(500).json({ 
      message: 'Failed to create match',
      error: error.message 
    });
  }
});

/**
 * GET /api/matches
 * Get all existing matches
 */
router.get('/matches', requireAuth, async (req: Request, res: Response) => {
  try {
    const matches = await db.getAllMatches();
    res.json({ matches });
  } catch (error: any) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ 
      message: 'Failed to fetch matches',
      error: error.message 
    });
  }
});

/**
 * DELETE /api/matches/:id
 * Remove a match by ID
 */
router.delete('/matches/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const matchId = parseInt(req.params.id);
    
    if (isNaN(matchId)) {
      return res.status(400).json({ message: 'Invalid match ID' });
    }

    await db.deleteMatch(matchId);
    res.json({ message: 'Match removed successfully' });
  } catch (error: any) {
    console.error('Error deleting match:', error);
    res.status(500).json({ 
      message: 'Failed to delete match',
      error: error.message 
    });
  }
});

/**
 * DELETE /api/matches/pair/:volunteerId/:gardenId
 * Remove a match by volunteer and garden pair
 */
router.delete('/matches/pair/:volunteerId/:gardenId', requireAuth, async (req: Request, res: Response) => {
  try {
    const volunteerId = parseInt(req.params.volunteerId);
    const gardenId = parseInt(req.params.gardenId);
    
    if (isNaN(volunteerId) || isNaN(gardenId)) {
      return res.status(400).json({ message: 'Invalid volunteer or garden ID' });
    }

    await db.deleteMatchByPair(volunteerId, gardenId);
    res.json({ message: 'Match removed successfully' });
  } catch (error: any) {
    console.error('Error deleting match:', error);
    res.status(500).json({ 
      message: 'Failed to delete match',
      error: error.message 
    });
  }
});

export default router;
