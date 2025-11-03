import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Mail, Eye, Trash2, ArrowRight, ExternalLink } from "lucide-react";
import { getAllMatches, deleteMatch } from "@/lib/api";
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

interface Match {
  id: number;
  volunteer_id: number;
  garden_id: number;
  volunteer_name: string;
  volunteer_email: string;
  volunteer_skills: string[];
  volunteer_availability: TimeSlot[];
  garden_name: string;
  garden_location: string;
  garden_contact_email: string;
  garden_skills_needed: string[];
  garden_needs_schedule: TimeSlot[];
  match_type: 'auto' | 'manual';
  match_score: number;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  notes?: string;
  email_sent: boolean;
  email_sent_at?: string;
  match_details?: MatchDetails;
  created_at: string;
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

function getStatusColor(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'accepted': return 'default';
    case 'pending': return 'secondary';
    case 'declined': return 'destructive';
    case 'cancelled': return 'outline';
    default: return 'secondary';
  }
}

export default function CurrentMatchesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch matches
  const { data: matchesData, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: getAllMatches,
  });

  const matches: Match[] = matchesData?.matches || [];

  // Delete match mutation
  const deleteMatchMutation = useMutation({
    mutationFn: (id: number) => deleteMatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({
        title: "Match Removed",
        description: "The match has been successfully removed",
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

  // Filter matches
  const filteredMatches = matches.filter(match => {
    if (statusFilter === "all") return true;
    return match.status === statusFilter;
  });

  const handleViewDetails = (match: Match) => {
    setSelectedMatch(match);
    setDetailsDialogOpen(true);
  };

  const handleSendEmail = (match: Match) => {
    const subject = encodeURIComponent(`Volunteer Match: ${match.garden_name}`);
    const body = encodeURIComponent(`
Hello ${match.volunteer_name},

Great news! We've matched you with ${match.garden_name}!

Garden Details:
- Location: ${match.garden_location}
- Contact: ${match.garden_contact_email}

Your Matched Schedule:
${match.match_details?.schedule_match.matched 
  ? formatTimeSlots(match.match_details.schedule_match.matched)
  : 'See details below'}

Skills Needed:
${match.garden_skills_needed.join(', ')}

Match Score: ${match.match_score}%

Please confirm your availability by replying to this email.

To accept this match, reply with "ACCEPT"
To decline this match, reply with "DECLINE"

Thank you for volunteering with Solidarity Gardens!

Best regards,
The Solidarity Gardens Team
    `);

    const mailtoLink = `mailto:${match.volunteer_email}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');

    // TODO: Mark email as sent in database
    toast({
      title: "Email Client Opened",
      description: "Email template has been opened in your default email client",
    });
  };

  const handleRemoveMatch = (matchId: number) => {
    if (confirm('Are you sure you want to remove this match?')) {
      deleteMatchMutation.mutate(matchId);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Matches</CardTitle>
          <CardDescription>
            Manage all volunteer-garden matches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Matches ({matches.length})</SelectItem>
                  <SelectItem value="pending">
                    Pending ({matches.filter(m => m.status === 'pending').length})
                  </SelectItem>
                  <SelectItem value="accepted">
                    Accepted ({matches.filter(m => m.status === 'accepted').length})
                  </SelectItem>
                  <SelectItem value="declined">
                    Declined ({matches.filter(m => m.status === 'declined').length})
                  </SelectItem>
                  <SelectItem value="cancelled">
                    Cancelled ({matches.filter(m => m.status === 'cancelled').length})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredMatches.length} of {matches.length} matches
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading matches...</p>
          </CardContent>
        </Card>
      ) : filteredMatches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {statusFilter === "all" 
                ? "No matches found. Create matches using Auto-Match or Manual Match tabs."
                : `No ${statusFilter} matches found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <Card key={match.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Match Info */}
                  <div className="flex-1 space-y-3">
                    {/* Volunteer → Garden */}
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-semibold">{match.volunteer_name}</h4>
                        <p className="text-xs text-muted-foreground">{match.volunteer_email}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">{match.garden_name}</h4>
                        <p className="text-xs text-muted-foreground">{match.garden_location}</p>
                      </div>
                    </div>

                    {/* Match Metadata */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant={getStatusColor(match.status)}>
                        {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                      </Badge>
                      <Badge variant="outline">
                        {match.match_score}% Match
                      </Badge>
                      <Badge variant="secondary">
                        {match.match_type === 'auto' ? 'Auto-Matched' : 'Manual Match'}
                      </Badge>
                      <span className="text-muted-foreground">
                        Created: {formatDate(match.created_at)}
                      </span>
                      {match.email_sent && (
                        <Badge variant="outline" className="bg-green-50">
                          ✓ Email Sent
                        </Badge>
                      )}
                    </div>

                    {/* Notes */}
                    {match.notes && (
                      <div className="p-2 bg-muted rounded text-sm">
                        <span className="font-medium">Notes: </span>
                        {match.notes}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendEmail(match)}
                      className="whitespace-nowrap"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Send Email
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(match)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveMatch(match.id)}
                      disabled={deleteMatchMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Match Details</DialogTitle>
            <DialogDescription>
              Complete information about this volunteer-garden match
            </DialogDescription>
          </DialogHeader>

          {selectedMatch && (
            <div className="space-y-4">
              {/* Match Overview */}
              <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="font-semibold">{selectedMatch.volunteer_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedMatch.volunteer_email}</p>
                </div>
                <ArrowRight className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <p className="font-semibold">{selectedMatch.garden_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedMatch.garden_location}</p>
                </div>
              </div>

              {/* Match Score */}
              <div className="text-center">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {selectedMatch.match_score}% Overall Match
                </Badge>
              </div>

              {/* Volunteer Details */}
              <div>
                <h4 className="font-semibold mb-2">Volunteer Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Skills: </span>
                    {selectedMatch.volunteer_skills.join(', ')}
                  </div>
                  <div>
                    <span className="font-medium">Availability: </span>
                    {formatTimeSlots(selectedMatch.volunteer_availability)}
                  </div>
                </div>
              </div>

              {/* Garden Details */}
              <div>
                <h4 className="font-semibold mb-2">Garden Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Contact: </span>
                    <a 
                      href={`mailto:${selectedMatch.garden_contact_email}`}
                      className="text-primary hover:underline"
                    >
                      {selectedMatch.garden_contact_email}
                      <ExternalLink className="inline h-3 w-3 ml-1" />
                    </a>
                  </div>
                  <div>
                    <span className="font-medium">Skills Needed: </span>
                    {selectedMatch.garden_skills_needed.join(', ')}
                  </div>
                  <div>
                    <span className="font-medium">Schedule Needed: </span>
                    {formatTimeSlots(selectedMatch.garden_needs_schedule)}
                  </div>
                </div>
              </div>

              {/* Match Breakdown */}
              {selectedMatch.match_details && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Match Breakdown</h4>
                  
                  {/* Skills Match */}
                  <div className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Skills Match</span>
                      <Badge variant="outline">
                        {selectedMatch.match_details.skills_match.percentage}
                      </Badge>
                    </div>
                    {selectedMatch.match_details.skills_match.matched.length > 0 && (
                      <p className="text-sm text-green-600 mb-1">
                        ✓ Matched: {selectedMatch.match_details.skills_match.matched.join(', ')}
                      </p>
                    )}
                    {selectedMatch.match_details.skills_match.missing.length > 0 && (
                      <p className="text-sm text-orange-600">
                        ⚠ Missing: {selectedMatch.match_details.skills_match.missing.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Schedule Match */}
                  <div className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Schedule Match</span>
                      <Badge variant="outline">
                        {selectedMatch.match_details.schedule_match.percentage}
                      </Badge>
                    </div>
                    {selectedMatch.match_details.schedule_match.matched.length > 0 && (
                      <p className="text-sm text-green-600 mb-1">
                        ✓ Available: {formatTimeSlots(selectedMatch.match_details.schedule_match.matched)}
                      </p>
                    )}
                    {selectedMatch.match_details.schedule_match.missing.length > 0 && (
                      <p className="text-sm text-orange-600">
                        ⚠ Not available: {formatTimeSlots(selectedMatch.match_details.schedule_match.missing)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Match Metadata */}
              <div className="pt-3 border-t text-sm text-muted-foreground space-y-1">
                <p>Match Type: {selectedMatch.match_type === 'auto' ? 'Auto-Matched' : 'Manual Match'}</p>
                <p>Status: {selectedMatch.status.charAt(0).toUpperCase() + selectedMatch.status.slice(1)}</p>
                <p>Created: {formatDate(selectedMatch.created_at)}</p>
                {selectedMatch.email_sent && selectedMatch.email_sent_at && (
                  <p>Email Sent: {formatDate(selectedMatch.email_sent_at)}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
