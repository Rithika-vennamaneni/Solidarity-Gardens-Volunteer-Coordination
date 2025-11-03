import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target, Mail, MapPin, Award, Percent } from "lucide-react";
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

  const experienceLabels = {
    new: "New",
    some: "Some Experience",
    experienced: "Experienced",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Auto-Match Volunteers</CardTitle>
          <CardDescription>Select a garden to find matching volunteers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedGardenId} onValueChange={setSelectedGardenId}>
                <SelectTrigger data-testid="select-garden">
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
              disabled={!selectedGardenId}
              data-testid="button-find-matches"
            >
              <Target className="h-4 w-4 mr-2" />
              Find Matches
            </Button>
          </div>

          {selectedGarden && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium mb-2">Selected Garden Needs:</p>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedGarden.skills_needed.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Schedule Needed</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedGarden.needs_schedule && selectedGarden.needs_schedule.length > 0
                      ? selectedGarden.needs_schedule.map((slot: any, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {slot.day} - {slot.time}
                          </span>
                        ))
                      : <span className="text-sm text-muted-foreground">No schedule set</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {matches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Matching Volunteers ({matches.length})
            </h3>
            <p className="text-sm text-muted-foreground">
              Sorted by match percentage
            </p>
          </div>

          <div className="grid gap-4">
            {matches.map((match: any) => {
              const { volunteer, matchPercentage, matchingSkills, matchingDays, matchingTimes } = match;
              return (
              <Card key={volunteer.id} data-testid={`card-match-${volunteer.id}`}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{volunteer.name}</CardTitle>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <a
                            href={`mailto:${volunteer.email}`}
                            className="hover:text-foreground"
                          >
                            {volunteer.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {volunteer.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={matchPercentage >= 70 ? "default" : "secondary"}
                        className="text-lg px-3 py-1"
                      >
                        <Percent className="h-4 w-4 mr-1" />
                        {matchPercentage}%
                      </Badge>
                      <Badge variant="outline">
                        <Award className="h-3 w-3 mr-1" />
                        {experienceLabels[volunteer.experience_level]}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {matchingSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Matching Skills
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {matchingSkills.map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    {matchingDays.length > 0 && (
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">
                          Matching Days
                        </p>
                        <p>{matchingDays.join(", ")}</p>
                      </div>
                    )}
                    {matchingTimes.length > 0 && (
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">
                          Matching Times
                        </p>
                        <p>{matchingTimes.join(", ")}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        </div>
      )}

      {selectedGardenId && matches.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No matching volunteers found. Try posting to a wider audience or adjusting requirements.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
