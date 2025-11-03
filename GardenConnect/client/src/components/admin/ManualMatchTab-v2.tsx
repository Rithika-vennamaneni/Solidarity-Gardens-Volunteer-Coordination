import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Check } from "lucide-react";
import { getAllVolunteers, getAllGardens, createManualMatch } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TimeSlot {
  day: string;
  time: string;
}

interface Volunteer {
  id: number;
  name: string;
  email: string;
  skills: string[];
  availability: TimeSlot[];
  location: string;
  experience_level: string;
}

interface Garden {
  id: number;
  garden_name: string;
  location: string;
  contact_email: string;
  skills_needed: string[];
  needs_schedule: TimeSlot[];
  additional_notes?: string;
}

function formatTimeSlots(slots: TimeSlot[]): string {
  if (!slots || slots.length === 0) return 'None specified';
  
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

export default function ManualMatchTabV2() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [selectedGarden, setSelectedGarden] = useState<Garden | null>(null);

  // Fetch data
  const { data: volunteersData } = useQuery({
    queryKey: ['volunteers'],
    queryFn: getAllVolunteers,
  });

  const { data: gardensData } = useQuery({
    queryKey: ['gardens'],
    queryFn: getAllGardens,
  });

  const volunteers: Volunteer[] = volunteersData?.volunteers || [];
  const gardens: Garden[] = gardensData?.gardens || [];

  // Create match mutation
  const createMatchMutation = useMutation({
    mutationFn: ({ volunteerId, gardenId }: { volunteerId: number; gardenId: number }) =>
      createManualMatch(volunteerId, gardenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({
        title: "Match Created",
        description: `${selectedVolunteer?.name} has been matched with ${selectedGarden?.garden_name}`,
      });
      // Clear selections
      setSelectedVolunteer(null);
      setSelectedGarden(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateMatch = () => {
    if (!selectedVolunteer || !selectedGarden) return;
    
    createMatchMutation.mutate({
      volunteerId: selectedVolunteer.id,
      gardenId: selectedGarden.id,
    });
  };

  const handleClearSelection = () => {
    setSelectedVolunteer(null);
    setSelectedGarden(null);
  };

  // Calculate preview match details
  const getMatchPreview = () => {
    if (!selectedVolunteer || !selectedGarden) return null;

    // SAFETY: Ensure arrays exist, fallback to empty arrays
    const volunteerSkills = selectedVolunteer.skills || [];
    const volunteerAvailability = selectedVolunteer.availability || [];
    const gardenSkillsNeeded = selectedGarden.skills_needed || [];
    const gardenNeedsSchedule = selectedGarden.needs_schedule || [];

    console.log('[ManualMatch] Preview calculation:', {
      volunteer: selectedVolunteer.name,
      volunteerSkills,
      volunteerAvailability,
      garden: selectedGarden.garden_name,
      gardenSkillsNeeded,
      gardenNeedsSchedule
    });

    // Calculate skills match
    const matchedSkills = volunteerSkills.filter(skill =>
      gardenSkillsNeeded.includes(skill)
    );
    const missingSkills = gardenSkillsNeeded.filter(skill =>
      !volunteerSkills.includes(skill)
    );

    // Calculate schedule match
    const matchedSlots: TimeSlot[] = [];
    const missingSlots: TimeSlot[] = [];

    gardenNeedsSchedule.forEach(neededSlot => {
      const hasMatch = volunteerAvailability.some(
        availSlot => availSlot.day === neededSlot.day && availSlot.time === neededSlot.time
      );
      
      if (hasMatch) {
        matchedSlots.push(neededSlot);
      } else {
        missingSlots.push(neededSlot);
      }
    });

    const skillsPercentage = gardenSkillsNeeded.length > 0
      ? Math.round((matchedSkills.length / gardenSkillsNeeded.length) * 100)
      : 0;

    const schedulePercentage = gardenNeedsSchedule.length > 0
      ? Math.round((matchedSlots.length / gardenNeedsSchedule.length) * 100)
      : 0;

    const overallScore = Math.round((skillsPercentage * 0.4) + (schedulePercentage * 0.6));

    return {
      matchedSkills,
      missingSkills,
      matchedSlots,
      missingSlots,
      skillsPercentage,
      schedulePercentage,
      overallScore,
    };
  };

  const matchPreview = getMatchPreview();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manual Match</CardTitle>
          <CardDescription>
            Select a volunteer and a garden to create a custom match
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Volunteers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Volunteers ({volunteers.length})
            </CardTitle>
            <CardDescription>
              Click to select a volunteer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {volunteers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No volunteers available
              </p>
            ) : (
              volunteers.map(volunteer => (
                <div
                  key={volunteer.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedVolunteer?.id === volunteer.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedVolunteer(volunteer)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {volunteer.name}
                        {selectedVolunteer?.id === volunteer.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">{volunteer.email}</p>
                    </div>
                    <Badge variant="outline">{volunteer.experience_level}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {(volunteer.skills || []).map(skill => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Available:</p>
                      <p className="text-xs">
                        {formatTimeSlots(volunteer.availability || [])}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Location:</p>
                      <p className="text-xs">{volunteer.location}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right Column: Gardens */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Gardens ({gardens.length})
            </CardTitle>
            <CardDescription>
              Click to select a garden
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {gardens.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No gardens available
              </p>
            ) : (
              gardens.map(garden => (
                <div
                  key={garden.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedGarden?.id === garden.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedGarden(garden)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {garden.garden_name}
                        {selectedGarden?.id === garden.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">{garden.location}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Skills Needed:</p>
                      <div className="flex flex-wrap gap-1">
                        {(garden.skills_needed || []).map(skill => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Schedule Needed:</p>
                      <p className="text-xs">
                        {formatTimeSlots(garden.needs_schedule || [])}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Contact:</p>
                      <p className="text-xs">{garden.contact_email}</p>
                    </div>

                    {garden.additional_notes && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Notes:</p>
                        <p className="text-xs">{garden.additional_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Match Preview and Confirmation */}
      {selectedVolunteer && selectedGarden && matchPreview && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Create Match</span>
              <Badge variant="outline" className="text-lg">
                {matchPreview.overallScore}% Match
              </Badge>
            </CardTitle>
            <CardDescription>
              Review the match details below and confirm
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Match Summary */}
            <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="font-semibold">{selectedVolunteer.name}</p>
                <p className="text-xs text-muted-foreground">{selectedVolunteer.email}</p>
              </div>
              <ArrowRight className="h-6 w-6 text-primary" />
              <div className="text-center">
                <p className="font-semibold">{selectedGarden.garden_name}</p>
                <p className="text-xs text-muted-foreground">{selectedGarden.location}</p>
              </div>
            </div>

            {/* Skills Match */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center justify-between">
                <span>Skills Match</span>
                <Badge variant="outline">{matchPreview.skillsPercentage}%</Badge>
              </h4>
              {matchPreview.matchedSkills.length > 0 && (
                <p className="text-sm text-green-600 mb-1">
                  ✓ Matched: {matchPreview.matchedSkills.join(', ')}
                </p>
              )}
              {matchPreview.missingSkills.length > 0 && (
                <p className="text-sm text-orange-600">
                  ⚠ Missing: {matchPreview.missingSkills.join(', ')}
                </p>
              )}
            </div>

            {/* Schedule Match */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center justify-between">
                <span>Schedule Match</span>
                <Badge variant="outline">{matchPreview.schedulePercentage}%</Badge>
              </h4>
              {matchPreview.matchedSlots.length > 0 && (
                <p className="text-sm text-green-600 mb-1">
                  ✓ Available: {formatTimeSlots(matchPreview.matchedSlots)}
                </p>
              )}
              {matchPreview.missingSlots.length > 0 && (
                <p className="text-sm text-orange-600">
                  ⚠ Not available: {formatTimeSlots(matchPreview.missingSlots)}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleCreateMatch} 
                className="flex-1"
                disabled={createMatchMutation.isPending}
              >
                {createMatchMutation.isPending ? 'Creating Match...' : 'Confirm Match'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClearSelection}
                disabled={createMatchMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions when nothing selected */}
      {!selectedVolunteer && !selectedGarden && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Select a volunteer from the left and a garden from the right to create a manual match
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
