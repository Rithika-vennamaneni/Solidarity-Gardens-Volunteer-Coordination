// TODO: remove mock functionality - temporary in-memory storage for prototype
import type { VolunteerFormData, GardenFormData } from "@shared/schema";

export interface StoredVolunteer extends VolunteerFormData {
  id: string;
  timestamp: number;
}

export interface StoredGarden extends GardenFormData {
  id: string;
  timestamp: number;
}

export interface ManualMatch {
  volunteerId: string;
  gardenId: string;
  timestamp: number;
}

export interface VolunteerMatch {
  volunteer: StoredVolunteer;
  matchPercentage: number;
  matchingSkills: string[];
  matchingDays: string[];
  matchingTimes: string[];
}

class TemporaryStorage {
  private volunteers: StoredVolunteer[] = [];
  private gardens: StoredGarden[] = [];
  private manualMatches: ManualMatch[] = [];

  addVolunteer(data: VolunteerFormData): string {
    const id = `volunteer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.volunteers.push({ ...data, id, timestamp: Date.now() });
    console.log('Volunteer added:', { ...data, id });
    return id;
  }

  addGarden(data: GardenFormData): string {
    const id = `garden-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.gardens.push({ ...data, id, timestamp: Date.now() });
    console.log('Garden added:', { ...data, id });
    return id;
  }

  getVolunteers(): StoredVolunteer[] {
    return this.volunteers;
  }

  getGardens(): StoredGarden[] {
    return this.gardens;
  }

  deleteGarden(gardenId: string): void {
    this.gardens = this.gardens.filter(g => g.id !== gardenId);
    this.manualMatches = this.manualMatches.filter(m => m.gardenId !== gardenId);
  }

  matchGardenWithVolunteers(gardenId: string): VolunteerMatch[] {
    const garden = this.gardens.find(g => g.id === gardenId);
    if (!garden) return [];

    return this.volunteers
      .map(volunteer => {
        const matchingSkills = volunteer.skills.filter(s => garden.skillsNeeded.includes(s));
        const matchingDays = volunteer.days.filter(d => garden.daysNeeded.includes(d));
        const matchingTimes = volunteer.times.filter(t => garden.timesNeeded.includes(t));
        
        const totalPossibleMatches = 
          garden.skillsNeeded.length + 
          garden.daysNeeded.length + 
          garden.timesNeeded.length;
        
        const actualMatches = 
          matchingSkills.length + 
          matchingDays.length + 
          matchingTimes.length;
        
        const matchPercentage = totalPossibleMatches > 0 
          ? Math.round((actualMatches / totalPossibleMatches) * 100)
          : 0;
        
        return {
          volunteer,
          matchPercentage,
          matchingSkills,
          matchingDays,
          matchingTimes,
        };
      })
      .filter(({ matchPercentage }) => matchPercentage > 0)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);
  }

  addManualMatch(volunteerId: string, gardenId: string): void {
    const existing = this.manualMatches.find(
      m => m.volunteerId === volunteerId && m.gardenId === gardenId
    );
    if (!existing) {
      this.manualMatches.push({ volunteerId, gardenId, timestamp: Date.now() });
    }
  }

  removeManualMatch(volunteerId: string, gardenId: string): void {
    this.manualMatches = this.manualMatches.filter(
      m => !(m.volunteerId === volunteerId && m.gardenId === gardenId)
    );
  }

  getManualMatches(): ManualMatch[] {
    return this.manualMatches;
  }

  getMatchesForGarden(gardenId: string): StoredVolunteer[] {
    const matches = this.manualMatches.filter(m => m.gardenId === gardenId);
    return matches
      .map(m => this.volunteers.find(v => v.id === m.volunteerId))
      .filter((v): v is StoredVolunteer => v !== undefined);
  }

  getMatchesForVolunteer(volunteerId: string): StoredGarden[] {
    const matches = this.manualMatches.filter(m => m.volunteerId === volunteerId);
    return matches
      .map(m => this.gardens.find(g => g.id === m.gardenId))
      .filter((g): g is StoredGarden => g !== undefined);
  }
}

export const temporaryStorage = new TemporaryStorage();
