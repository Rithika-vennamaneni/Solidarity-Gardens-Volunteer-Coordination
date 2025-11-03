import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link2, Unlink, Mail, MapPin } from "lucide-react";
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
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manual Match Management</CardTitle>
          <CardDescription>
            Manually pair volunteers with gardens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Click the match button next to any volunteer-garden pair to create or remove a manual match.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Current Matches ({matches.length})
        </h3>

        {matches.length > 0 ? (
          <div className="grid gap-4">
            {matches.map((match: any) => {
              const volunteer = volunteers.find((v: any) => v.id === match.volunteer_id);
              const garden = gardens.find((g: any) => g.id === match.garden_id);
              if (!volunteer || !garden) return null;

              return (
                <Card key={`${match.volunteer_id}-${match.garden_id}`} data-testid={`card-match-${match.volunteer_id}-${match.garden_id}`}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Volunteer</p>
                          <p className="font-medium">{volunteer.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {volunteer.email}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Garden</p>
                          <p className="font-medium">{garden.garden_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {garden.location}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUnmatch(match.volunteer_id, match.garden_id)}
                        data-testid={`button-unmatch-${match.volunteer_id}-${match.garden_id}`}
                      >
                        <Unlink className="h-4 w-4 mr-2" />
                        Unmatch
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No manual matches created yet
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Volunteers</h3>

        {volunteers.length > 0 ? (
          <div className="grid gap-4">
            {volunteers.map((volunteer: any) => {
              const volunteerMatches = getVolunteerMatches(volunteer.id);
              
              return (
                <Card key={volunteer.id} data-testid={`card-volunteer-${volunteer.id}`}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{volunteer.name}</CardTitle>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {volunteer.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {volunteer.location}
                          </div>
                        </div>
                      </div>
                      {volunteerMatches.length > 0 && (
                        <Badge variant="secondary">
                          {volunteerMatches.length} {volunteerMatches.length === 1 ? 'match' : 'matches'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Available for: {volunteer.skills.join(", ")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Match with Garden:</p>
                      <div className="grid gap-2">
                        {gardens.map((garden: any) => {
                          const matched = isMatched(volunteer.id, garden.id);
                          return (
                            <div
                              key={garden.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium">{garden.garden_name}</p>
                                <p className="text-xs text-muted-foreground">{garden.location}</p>
                              </div>
                              <Button
                                variant={matched ? "outline" : "default"}
                                size="sm"
                                onClick={() =>
                                  matched
                                    ? handleUnmatch(volunteer.id, garden.id)
                                    : handleMatch(volunteer.id, garden.id)
                                }
                                data-testid={`button-match-${volunteer.id}-${garden.id}`}
                              >
                                {matched ? (
                                  <>
                                    <Unlink className="h-4 w-4 mr-2" />
                                    Unmatch
                                  </>
                                ) : (
                                  <>
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Match
                                  </>
                                )}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No volunteers available
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
