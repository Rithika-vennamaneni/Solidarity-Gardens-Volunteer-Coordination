import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Check, X } from "lucide-react";
import { getAllVolunteers, getAllGardens, autoMatchGarden, createManualMatch } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TimeSlot {
  day: string;
  time: string;
}

interface MatchDetails {
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
    percentage: string;
  };
  overall_score: number;
}

interface VolunteerMatch {
  volunteer_id: number;
  volunteer_name: string;
  volunteer_email: string;
  volunteer_skills: string[];
  volunteer_availability: TimeSlot[];
  match_details: MatchDetails;
}

function formatTimeSlots(slots: TimeSlot[]): string {
  if (!slots || slots.length === 0) return 'None';
  
  const byDay: { [key: string]: string[] } = {};
  slots.forEach(slot => {
    if (!byDay[slot.day]) {
      byDay[slot.day] = [];
    }
    byDay[slot.day].push(slot.time);
  });

  return Object.entries(byDay)
    .map(([day, times]) => `${day} (${times.join(', ')})`)
    .join(', ');
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreBadgeVariant(score: number): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 80) return 'default';
  if (score >= 60) return 'secondary';
  if (score >= 40) return 'outline';
  return 'destructive';
}

export default function AutoMatchTabV2() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedGardenId, setSelectedGardenId] = useState<string>("");
  const [matches, setMatches] = useState<VolunteerMatch[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<VolunteerMatch | null>(null);

  // Fetch data
  const { data: gardensData } = useQuery({
    queryKey: ['gardens'],
    queryFn: getAllGardens,
  });

  const gardens = gardensData?.gardens || [];

  // Create match mutation
  const createMatchMutation = useMutation({
    mutationFn: ({ volunteerId, gardenId }: { volunteerId: number; gardenId: number }) =>
      createManualMatch(volunteerId, gardenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({
        title: "Match Created",
        description: `Volunteer has been matched successfully`,
      });
      setSelectedMatch(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFindMatches = async () => {
    if (!selectedGardenId) return;

    setIsMatching(true);
    try {
      const response = await autoMatchGarden(parseInt(selectedGardenId));
      console.log('[AutoMatch] Response:', response);
      
      if (response.matches && Array.isArray(response.matches)) {
        setMatches(response.matches);
        toast({
          title: "Matches Found",
          description: `Found ${response.matches.length} matching volunteer${response.matches.length !== 1 ? 's' : ''}`,
        });
      } else {
        setMatches([]);
        toast({
          title: "No Matches",
          description: "No volunteers match the requirements for this garden",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('[AutoMatch] Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to find matches",
        variant: "destructive",
      });
      setMatches([]);
    } finally {
      setIsMatching(false);
    }
  };

  const handleSelectMatch = (match: VolunteerMatch) => {
    setSelectedMatch(match);
  };

  const handleConfirmMatch = () => {
    if (!selectedMatch || !selectedGardenId) return;
    
    createMatchMutation.mutate({
      volunteerId: selectedMatch.volunteer_id,
      gardenId: parseInt(selectedGardenId),
    });
  };

  const selectedGarden = gardens.find(g => g.id === parseInt(selectedGardenId));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Auto-Match Volunteers</CardTitle>
          <CardDescription>
            Select a garden to find the best matching volunteers based on skills and availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedGardenId} onValueChange={setSelectedGardenId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a garden..." />
                </SelectTrigger>
                <SelectContent>
                  {gardens.map((garden: any) => (
                    <SelectItem key={garden.id} value={garden.id.toString()}>
                      {garden.garden_name} - {garden.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleFindMatches} 
              disabled={!selectedGardenId || isMatching}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isMatching ? 'Finding Matches...' : 'Find Matches'}
            </Button>
          </div>

          {/* Selected Garden Info */}
          {selectedGarden && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">{selectedGarden.garden_name}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Skills Needed:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedGarden.skills_needed?.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Schedule Needed:</p>
                  <p className="text-xs">{formatTimeSlots(selectedGarden.needs_schedule || [])}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Match Results */}
      {matches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Found {matches.length} Matching Volunteer{matches.length !== 1 ? 's' : ''}
          </h3>

          {matches.map((match) => (
            <Card 
              key={match.volunteer_id}
              className={`transition-all ${
                selectedMatch?.volunteer_id === match.volunteer_id
                  ? 'border-primary shadow-lg'
                  : 'hover:shadow-md'
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{match.volunteer_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{match.volunteer_email}</p>
                  </div>
                  <Badge 
                    variant={getScoreBadgeVariant(match.match_details.overall_score)}
                    className="text-lg px-3 py-1"
                  >
                    {match.match_details.overall_score}% Match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Skills Match Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Skills Match</h4>
                    <span className={`text-sm font-semibold ${getScoreColor(parseFloat(match.match_details.skills_match.percentage))}`}>
                      {match.match_details.skills_match.percentage}
                    </span>
                  </div>
                  <Progress 
                    value={parseFloat(match.match_details.skills_match.percentage)} 
                    className="h-2"
                  />
                  <div className="space-y-1">
                    {match.match_details.skills_match.matched.length > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-green-600">Matched Skills: </span>
                          <span className="text-muted-foreground">
                            {match.match_details.skills_match.matched.join(', ')}
                          </span>
                        </div>
                      </div>
                    )}
                    {match.match_details.skills_match.missing.length > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <X className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-orange-600">Missing Skills: </span>
                          <span className="text-muted-foreground">
                            {match.match_details.skills_match.missing.join(', ')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Schedule Match Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Schedule Match</h4>
                    <span className={`text-sm font-semibold ${getScoreColor(parseFloat(match.match_details.schedule_match.percentage))}`}>
                      {match.match_details.schedule_match.percentage}
                    </span>
                  </div>
                  <Progress 
                    value={parseFloat(match.match_details.schedule_match.percentage)} 
                    className="h-2"
                  />
                  <div className="space-y-1">
                    {match.match_details.schedule_match.matched.length > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-green-600">Available: </span>
                          <span className="text-muted-foreground">
                            {formatTimeSlots(match.match_details.schedule_match.matched)}
                          </span>
                        </div>
                      </div>
                    )}
                    {match.match_details.schedule_match.missing.length > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <X className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-orange-600">Not Available: </span>
                          <span className="text-muted-foreground">
                            {formatTimeSlots(match.match_details.schedule_match.missing)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Volunteer's Full Availability */}
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Volunteer's Full Availability:
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeSlots(match.volunteer_availability)}
                  </p>
                </div>

                {/* Action Button */}
                <Button 
                  onClick={() => handleSelectMatch(match)}
                  variant={selectedMatch?.volunteer_id === match.volunteer_id ? "default" : "outline"}
                  className="w-full"
                >
                  {selectedMatch?.volunteer_id === match.volunteer_id ? 'Selected' : 'Select This Volunteer'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No matches message */}
      {selectedGardenId && matches.length === 0 && !isMatching && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No matching volunteers found. Try posting to a wider audience or adjusting requirements.</p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      {selectedMatch && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Confirm Match</CardTitle>
            <CardDescription>
              Create a match between this volunteer and the selected garden?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold mb-2">{selectedMatch.volunteer_name}</p>
              <p className="text-sm text-muted-foreground mb-3">{selectedMatch.volunteer_email}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {selectedMatch.match_details.overall_score}% Match
                </Badge>
                <Badge variant="secondary">
                  Skills: {selectedMatch.match_details.skills_match.percentage}
                </Badge>
                <Badge variant="secondary">
                  Schedule: {selectedMatch.match_details.schedule_match.percentage}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleConfirmMatch}
                disabled={createMatchMutation.isPending}
                className="flex-1"
              >
                {createMatchMutation.isPending ? 'Creating Match...' : 'Confirm Match'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setSelectedMatch(null)}
                disabled={createMatchMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
