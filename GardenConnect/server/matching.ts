// Matching algorithm for volunteers and gardens

interface Volunteer {
  id: number;
  name: string;
  email: string;
  skills: string[];
  available_days: string[];
  available_times: string[];
  location: string;
  experience_level: string;
}

interface Garden {
  id: number;
  garden_name: string;
  location: string;
  contact_email: string;
  skills_needed: string[];
  days_needed: string[];
  times_needed: string[];
  additional_notes?: string;
}

interface MatchResult {
  volunteer: Volunteer;
  matchScore: number;
  matchPercentage: number;
  matchingSkills: string[];
  matchingDays: string[];
  matchingTimes: string[];
}

/**
 * Calculate match score between a volunteer and a garden
 * Formula:
 * - Skills match: (matching skills / total skills needed) × 40%
 * - Days match: (matching days / total days needed) × 30%
 * - Times match: (matching times / total times needed) × 30%
 */
export function calculateMatchScore(volunteer: Volunteer, garden: Garden): MatchResult {
  // Calculate skill match
  const matchingSkills = volunteer.skills.filter(skill => 
    garden.skills_needed.includes(skill)
  );
  const skillScore = garden.skills_needed.length > 0
    ? (matchingSkills.length / garden.skills_needed.length) * 40
    : 0;

  // Calculate day match
  const matchingDays = volunteer.available_days.filter(day => 
    garden.days_needed.includes(day)
  );
  const dayScore = garden.days_needed.length > 0
    ? (matchingDays.length / garden.days_needed.length) * 30
    : 0;

  // Calculate time match
  const matchingTimes = volunteer.available_times.filter(time => 
    garden.times_needed.includes(time)
  );
  const timeScore = garden.times_needed.length > 0
    ? (matchingTimes.length / garden.times_needed.length) * 30
    : 0;

  // Total score
  const totalScore = skillScore + dayScore + timeScore;
  const matchPercentage = Math.round(totalScore);

  return {
    volunteer,
    matchScore: matchPercentage,
    matchPercentage,
    matchingSkills,
    matchingDays,
    matchingTimes
  };
}

/**
 * Find all volunteers that match a garden and sort by match score
 */
export function matchVolunteersToGarden(
  volunteers: Volunteer[],
  garden: Garden,
  minScore: number = 0
): MatchResult[] {
  const matches = volunteers
    .map(volunteer => calculateMatchScore(volunteer, garden))
    .filter(match => match.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore);

  return matches;
}
