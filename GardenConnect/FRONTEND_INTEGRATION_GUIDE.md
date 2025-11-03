# Frontend Integration Guide

This guide shows you how to connect your existing frontend components to the new backend API.

## Overview

Your frontend is already built with React and TypeScript. The backend API is now ready at `/api/*` endpoints. You need to replace the `temporaryStorage` calls with actual API calls.

## API Endpoints Summary

### Public Endpoints (No Auth)
- `POST /api/volunteers` - Register a new volunteer

### Admin Endpoints (Requires Auth Token)
- `POST /api/gardens` - Create a garden
- `GET /api/gardens` - Get all gardens
- `DELETE /api/gardens/:id` - Delete a garden
- `GET /api/volunteers` - Get all volunteers
- `GET /api/volunteers/:id` - Get single volunteer
- `GET /api/match/:gardenId` - Auto-match volunteers to garden
- `POST /api/matches` - Create manual match
- `GET /api/matches` - Get all matches
- `DELETE /api/matches/:id` - Delete match by ID
- `DELETE /api/matches/pair/:volunteerId/:gardenId` - Delete match by pair

---

## Step 1: Create API Helper Functions

Create a new file: `client/src/lib/api.ts`

```typescript
// client/src/lib/api.ts

const API_BASE = '/api';

// Helper to get auth token from Stack Auth
function getAuthToken(): string | null {
  // TODO: Replace with actual Stack Auth token retrieval
  // Example: return stackAuth.getToken();
  return localStorage.getItem('auth_token');
}

// Helper for authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================
// VOLUNTEER API
// ============================================

export async function createVolunteer(data: {
  name: string;
  email: string;
  skills: string[];
  days: string[];
  times: string[];
  location: string;
  experience: string;
}) {
  return fetchWithAuth(`${API_BASE}/volunteers`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAllVolunteers() {
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
  daysNeeded: string[];
  timesNeeded: string[];
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
```

---

## Step 2: Update VolunteerForm.tsx

Replace the `onSubmit` function in `client/src/components/VolunteerForm.tsx`:

```typescript
// Find this function around line 41:
const onSubmit = (data: VolunteerFormData) => {
  console.log("Volunteer form submitted:", data);
  temporaryStorage.addVolunteer(data);
  setLocation("/volunteer-confirmation");
};

// Replace with:
const onSubmit = async (data: VolunteerFormData) => {
  try {
    await createVolunteer({
      name: data.name,
      email: data.email,
      skills: data.skills,
      days: data.days,
      times: data.times,
      location: data.location,
      experience: data.experience,
    });
    setLocation("/volunteer-confirmation");
  } catch (error) {
    console.error("Error submitting volunteer form:", error);
    // TODO: Show error toast to user
    alert("Failed to submit form. Please try again.");
  }
};

// Add this import at the top:
import { createVolunteer } from "@/lib/api";
```

---

## Step 3: Update PostGardenTab.tsx

Replace the functions in `client/src/components/admin/PostGardenTab.tsx`:

```typescript
// Add imports at the top:
import { createGarden, getAllGardens, deleteGarden } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Replace the useState and form submission:
export default function PostGardenTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch gardens using React Query
  const { data: gardensData } = useQuery({
    queryKey: ['gardens'],
    queryFn: getAllGardens,
  });

  const gardens = gardensData?.gardens || [];

  // Create garden mutation
  const createMutation = useMutation({
    mutationFn: createGarden,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gardens'] });
      toast({
        title: "Garden Posted",
        description: "Garden has been added successfully.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete garden mutation
  const deleteMutation = useMutation({
    mutationFn: deleteGarden,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gardens'] });
      toast({
        title: "Garden Deleted",
        description: "The garden has been removed.",
      });
    },
  });

  const form = useForm<GardenFormData>({
    resolver: zodResolver(gardenFormSchema),
    defaultValues: {
      gardenName: "",
      location: "",
      contactEmail: "",
      skillsNeeded: [],
      daysNeeded: [],
      timesNeeded: [],
      notes: "",
    },
  });

  const onSubmit = (data: GardenFormData) => {
    createMutation.mutate(data);
  };

  const handleDelete = (gardenId: number) => {
    deleteMutation.mutate(gardenId);
  };

  // Rest of component stays the same...
}
```

---

## Step 4: Update ViewVolunteersTab.tsx

Replace the data fetching in `client/src/components/admin/ViewVolunteersTab.tsx`:

```typescript
// Add imports at the top:
import { getAllVolunteers } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

// Replace the volunteers line:
export default function ViewVolunteersTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [dayFilter, setDayFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState("");

  // Fetch volunteers using React Query
  const { data: volunteersData } = useQuery({
    queryKey: ['volunteers'],
    queryFn: getAllVolunteers,
  });

  const volunteers = volunteersData?.volunteers || [];

  // Rest of component stays the same...
}
```

---

## Step 5: Update AutoMatchTab.tsx

Replace the matching logic in `client/src/components/admin/AutoMatchTab.tsx`:

```typescript
// Add imports at the top:
import { getAllGardens, autoMatchGarden } from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function AutoMatchTab() {
  const [selectedGardenId, setSelectedGardenId] = useState<string>("");
  const [matches, setMatches] = useState<any[]>([]);

  // Fetch gardens
  const { data: gardensData } = useQuery({
    queryKey: ['gardens'],
    queryFn: getAllGardens,
  });

  const gardens = gardensData?.gardens || [];
  const selectedGarden = gardens.find((g: any) => g.id.toString() === selectedGardenId);

  // Auto-match mutation
  const matchMutation = useMutation({
    mutationFn: (gardenId: number) => autoMatchGarden(gardenId),
    onSuccess: (data) => {
      setMatches(data.matches || []);
    },
    onError: (error: Error) => {
      console.error("Error finding matches:", error);
      alert("Failed to find matches. Please try again.");
    },
  });

  const handleFindMatches = () => {
    if (selectedGardenId) {
      matchMutation.mutate(parseInt(selectedGardenId));
    }
  };

  // Update the matches mapping to use the new data structure:
  // The API returns matches with volunteer data already formatted
  // Just make sure to map available_days to days, available_times to times, etc.

  // Rest of component stays the same...
}
```

---

## Step 6: Update ManualMatchTab.tsx

Replace the matching logic in `client/src/components/admin/ManualMatchTab.tsx`:

```typescript
// Add imports at the top:
import { getAllVolunteers, getAllGardens, getAllMatches, createManualMatch, deleteMatchByPair } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ManualMatchTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: volunteersData } = useQuery({
    queryKey: ['volunteers'],
    queryFn: getAllVolunteers,
  });

  const { data: gardensData } = useQuery({
    queryKey: ['gardens'],
    queryFn: getAllGardens,
  });

  const { data: matchesData } = useQuery({
    queryKey: ['matches'],
    queryFn: getAllMatches,
  });

  const volunteers = volunteersData?.volunteers || [];
  const gardens = gardensData?.gardens || [];
  const matches = matchesData?.matches || [];

  // Create match mutation
  const createMatchMutation = useMutation({
    mutationFn: ({ volunteerId, gardenId }: { volunteerId: number; gardenId: number }) =>
      createManualMatch(volunteerId, gardenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({
        title: "Match Created",
        description: "Volunteer has been matched with the garden.",
      });
    },
  });

  // Delete match mutation
  const deleteMatchMutation = useMutation({
    mutationFn: ({ volunteerId, gardenId }: { volunteerId: number; gardenId: number }) =>
      deleteMatchByPair(volunteerId, gardenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({
        title: "Match Removed",
        description: "The match has been removed.",
      });
    },
  });

  const handleMatch = (volunteerId: number, gardenId: number) => {
    createMatchMutation.mutate({ volunteerId, gardenId });
  };

  const handleUnmatch = (volunteerId: number, gardenId: number) => {
    deleteMatchMutation.mutate({ volunteerId, gardenId });
  };

  const isMatched = (volunteerId: number, gardenId: number) => {
    return matches.some((m: any) => m.volunteer_id === volunteerId && m.garden_id === gardenId);
  };

  const getVolunteerMatches = (volunteerId: number) => {
    return matches.filter((m: any) => m.volunteer_id === volunteerId);
  };

  // Rest of component stays the same...
}
```

---

## Step 7: Setup React Query Provider

Make sure React Query is set up in your `client/src/App.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your existing app content */}
    </QueryClientProvider>
  );
}
```

---

## Step 8: Database Field Mapping

The database uses snake_case while your frontend uses camelCase. Here's the mapping:

| Frontend (camelCase) | Database (snake_case) |
|---------------------|----------------------|
| `days` | `available_days` |
| `times` | `available_times` |
| `experience` | `experience_level` |
| `gardenName` | `garden_name` |
| `contactEmail` | `contact_email` |
| `skillsNeeded` | `skills_needed` |
| `daysNeeded` | `days_needed` |
| `timesNeeded` | `times_needed` |
| `notes` | `additional_notes` |

When displaying data from the API, you may need to adjust property names.

---

## Step 9: Stack Auth Integration

To integrate Stack Auth properly:

1. Install Stack Auth SDK:
```bash
npm install @stackframe/stack
```

2. Update `client/src/lib/api.ts` to use Stack Auth:
```typescript
import { useStackApp } from "@stackframe/stack";

// In your components:
const stackApp = useStackApp();
const token = await stackApp.getToken();
```

3. Update the auth middleware in `server/auth.ts` to verify Stack Auth tokens properly.

---

## Testing Checklist

- [ ] Volunteer form submits to database
- [ ] Garden form creates gardens in database
- [ ] Gardens list displays from database
- [ ] Volunteers list displays from database
- [ ] Auto-match calculates scores correctly
- [ ] Manual match creates matches in database
- [ ] Delete operations work for gardens and matches
- [ ] Auth protection works on admin routes

---

## Environment Setup

1. Copy `.env.example` to `.env`
2. Add your Neon DATABASE_URL
3. Run the SQL schema in Neon console
4. Add Stack Auth credentials
5. Start the server: `npm run dev`
