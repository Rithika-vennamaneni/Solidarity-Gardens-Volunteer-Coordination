// client/src/lib/api.ts

const API_BASE = '/api';

// Helper to check if admin is authenticated
function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem('adminAuthenticated') === 'true';
}

// Helper for authenticated requests (admin only)
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  console.log('[API] Making request to:', url);
  console.log('[API] Request options:', options);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // For admin routes, add a simple auth token
  if (isAdminAuthenticated()) {
    headers['Authorization'] = `Bearer admin-session-${Date.now()}`;
    console.log('[API] Admin authenticated, adding auth header');
  } else {
    console.log('[API] No admin authentication found');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('[API] Response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      console.error('[API] Request failed:', error);
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] Response data:', data);
    return data;
  } catch (error) {
    console.error('[API] Fetch error:', error);
    throw error;
  }
}

// Helper for public requests (no auth required)
async function fetchPublic(url: string, options: RequestInit = {}) {
  console.log('[API PUBLIC] Making request to:', url);
  console.log('[API PUBLIC] Request options:', options);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('[API PUBLIC] Response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      console.error('[API PUBLIC] Request failed:', error);
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('[API PUBLIC] Response data:', data);
    return data;
  } catch (error) {
    console.error('[API PUBLIC] Fetch error:', error);
    throw error;
  }
}

// ============================================
// VOLUNTEER API
// ============================================

interface TimeSlot {
  day: string;
  time: string;
}

export async function createVolunteer(data: {
  name: string;
  email: string;
  skills: string[];
  availability: TimeSlot[]; // UPDATED: Grid-based availability
  location: string;
  experience: string;
}) {
  console.log('[createVolunteer] Submitting volunteer data:', data);
  // Volunteer signup is public, no auth required
  return fetchPublic(`${API_BASE}/volunteers`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAllVolunteers() {
  console.log('[getAllVolunteers] Fetching all volunteers');
  // Admin route - requires auth
  return fetchWithAuth(`${API_BASE}/volunteers`);
}

export async function getVolunteerById(id: number) {
  return fetchWithAuth(`${API_BASE}/volunteers/${id}`);
}

// ============================================
// GARDEN API
// ============================================

export async function createGarden(data: {
  gardenName: string;
  location: string;
  contactEmail: string;
  skillsNeeded: string[];
  needsSchedule: TimeSlot[]; // UPDATED: Grid-based schedule
  notes?: string;
}) {
  return fetchWithAuth(`${API_BASE}/gardens`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAllGardens() {
  return fetchWithAuth(`${API_BASE}/gardens`);
}

export async function deleteGarden(id: number) {
  return fetchWithAuth(`${API_BASE}/gardens/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// MATCHING API
// ============================================

export async function autoMatchGarden(gardenId: number) {
  return fetchWithAuth(`${API_BASE}/match/${gardenId}`);
}

export async function createManualMatch(volunteerId: number, gardenId: number) {
  return fetchWithAuth(`${API_BASE}/matches`, {
    method: 'POST',
    body: JSON.stringify({ volunteerId, gardenId }),
  });
}

export async function getAllMatches() {
  return fetchWithAuth(`${API_BASE}/matches`);
}

export async function deleteMatch(id: number) {
  return fetchWithAuth(`${API_BASE}/matches/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteMatchByPair(volunteerId: number, gardenId: number) {
  return fetchWithAuth(`${API_BASE}/matches/pair/${volunteerId}/${gardenId}`, {
    method: 'DELETE',
  });
}