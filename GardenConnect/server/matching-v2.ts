// Enhanced matching algorithm with detailed breakdown
// Matches volunteers to gardens based on exact time slot overlaps

export interface TimeSlot {
  day: string;
  time: string;
}

export interface MatchDetails {
  skills_match: {
    score: number;
    matched: string[];
    missing: string[];
    percentage: string;
  };
  schedule_match: {
    score: number;
    matched: TimeSlot[];
    missing: TimeSlot[];
    volunteer_available: TimeSlot[];
    percentage: string;
  };
  overall_score: number;
}

export interface VolunteerMatch {
  volunteer_id: number;
  volunteer_name: string;
  volunteer_email: string;
  volunteer_skills: string[];
  volunteer_availability: TimeSlot[];
  match_details: MatchDetails;
}

/**
 * Calculate match score between a volunteer and a garden
 * Skills contribute 40% to the score
 * Schedule overlap contributes 60% to the score
 */
export function calculateMatch(
  volunteer: {
    id: number;
    name: string;
    email: string;
    skills: string[];
    availability: TimeSlot[];
  },
  garden: {
    skills_needed: string[];
    needs_schedule: TimeSlot[];
  }
): MatchDetails {
  console.log('[MATCHING] Calculating match for volunteer:', volunteer.name);
  console.log('[MATCHING] Garden needs:', { skills: garden.skills_needed, schedule: garden.needs_schedule });

  // Calculate skills match
  const matchedSkills = volunteer.skills.filter(skill => 
    garden.skills_needed.includes(skill)
  );
  const missingSkills = garden.skills_needed.filter(skill => 
    !volunteer.skills.includes(skill)
  );
  
  const skillsScore = garden.skills_needed.length > 0
    ? (matchedSkills.length / garden.skills_needed.length) * 40
    : 0;

  console.log('[MATCHING] Skills - Matched:', matchedSkills, 'Missing:', missingSkills, 'Score:', skillsScore);

  // Calculate schedule match (exact time slot overlaps)
  const matchedSlots: TimeSlot[] = [];
  const missingSlots: TimeSlot[] = [];

  for (const neededSlot of garden.needs_schedule) {
    const hasMatch = volunteer.availability.some(
      availSlot => availSlot.day === neededSlot.day && availSlot.time === neededSlot.time
    );
    
    if (hasMatch) {
      matchedSlots.push(neededSlot);
    } else {
      missingSlots.push(neededSlot);
    }
  }

  const scheduleScore = garden.needs_schedule.length > 0
    ? (matchedSlots.length / garden.needs_schedule.length) * 60
    : 0;

  console.log('[MATCHING] Schedule - Matched:', matchedSlots.length, 'Missing:', missingSlots.length, 'Score:', scheduleScore);

  const overallScore = skillsScore + scheduleScore;

  console.log('[MATCHING] Overall score:', overallScore.toFixed(2));

  return {
    skills_match: {
      score: skillsScore,
      matched: matchedSkills,
      missing: missingSkills,
      percentage: garden.skills_needed.length > 0
        ? `${Math.round((matchedSkills.length / garden.skills_needed.length) * 100)}%`
        : '0%'
    },
    schedule_match: {
      score: scheduleScore,
      matched: matchedSlots,
      missing: missingSlots,
      volunteer_available: volunteer.availability,
      percentage: garden.needs_schedule.length > 0
        ? `${Math.round((matchedSlots.length / garden.needs_schedule.length) * 100)}%`
        : '0%'
    },
    overall_score: Math.round(overallScore * 100) / 100
  };
}

/**
 * Find all volunteers that match a garden's requirements
 * Returns volunteers sorted by match score (highest first)
 * Only returns volunteers with a minimum match score (default: 30%)
 */
export function matchVolunteersToGarden(
  volunteers: Array<{
    id: number;
    name: string;
    email: string;
    skills: string[];
    availability: TimeSlot[];
  }>,
  garden: {
    skills_needed: string[];
    needs_schedule: TimeSlot[];
  },
  minScore: number = 30
): VolunteerMatch[] {
  console.log('[MATCHING] Finding matches for garden');
  console.log('[MATCHING] Total volunteers to check:', volunteers.length);
  console.log('[MATCHING] Minimum score threshold:', minScore);

  const matches: VolunteerMatch[] = [];

  for (const volunteer of volunteers) {
    const matchDetails = calculateMatch(volunteer, garden);

    // Only include if meets minimum score
    if (matchDetails.overall_score >= minScore) {
      matches.push({
        volunteer_id: volunteer.id,
        volunteer_name: volunteer.name,
        volunteer_email: volunteer.email,
        volunteer_skills: volunteer.skills,
        volunteer_availability: volunteer.availability,
        match_details: matchDetails
      });
    }
  }

  // Sort by overall score (highest first)
  matches.sort((a, b) => b.match_details.overall_score - a.match_details.overall_score);

  console.log('[MATCHING] Found', matches.length, 'matching volunteers');
  if (matches.length > 0) {
    console.log('[MATCHING] Best match:', matches[0].volunteer_name, 'with score:', matches[0].match_details.overall_score);
  }

  return matches;
}

/**
 * Generate a human-readable explanation of the match
 */
export function generateMatchExplanation(matchDetails: MatchDetails): string {
  const parts: string[] = [];

  // Skills explanation
  if (matchDetails.skills_match.matched.length > 0) {
    parts.push(`Matched skills: ${matchDetails.skills_match.matched.join(', ')}`);
  }
  if (matchDetails.skills_match.missing.length > 0) {
    parts.push(`Missing skills: ${matchDetails.skills_match.missing.join(', ')}`);
  }

  // Schedule explanation
  if (matchDetails.schedule_match.matched.length > 0) {
    const slots = matchDetails.schedule_match.matched
      .map(slot => `${slot.day} ${slot.time}`)
      .join(', ');
    parts.push(`Available for: ${slots}`);
  }
  if (matchDetails.schedule_match.missing.length > 0) {
    const slots = matchDetails.schedule_match.missing
      .map(slot => `${slot.day} ${slot.time}`)
      .join(', ');
    parts.push(`Not available for: ${slots}`);
  }

  return parts.join('. ');
}

/**
 * Format time slots for display
 */
export function formatTimeSlots(slots: TimeSlot[]): string {
  if (slots.length === 0) return 'None';
  
  // Group by day
  const byDay: { [key: string]: string[] } = {};
  slots.forEach(slot => {
    if (!byDay[slot.day]) {
      byDay[slot.day] = [];
    }
    byDay[slot.day].push(slot.time);
  });

  // Format as "Monday (Morning, Afternoon), Tuesday (Evening)"
  return Object.entries(byDay)
    .map(([day, times]) => `${day} (${times.join(', ')})`)
    .join(', ');
}
