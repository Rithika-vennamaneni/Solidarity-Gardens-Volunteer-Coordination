import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, MapPin, Calendar, Clock, Award } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { skillOptions, dayOptions } from "@shared/schema";
import { getAllVolunteers } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

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

  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((volunteer: any) => {
      const matchesSearch =
        searchTerm === "" ||
        volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volunteer.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSkill =
        skillFilter === "all" || volunteer.skills.includes(skillFilter);

      const matchesDay =
        dayFilter === "all" || 
        (volunteer.availability && volunteer.availability.some((slot: any) => slot.day === dayFilter));

      const matchesLocation =
        locationFilter === "" ||
        volunteer.location.toLowerCase().includes(locationFilter.toLowerCase());

      return matchesSearch && matchesSkill && matchesDay && matchesLocation;
    });
  }, [volunteers, searchTerm, skillFilter, dayFilter, locationFilter]);

  const experienceLabels: Record<string, string> = {
    new: "New",
    some: "Some Experience",
    experienced: "Experienced",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-12"
            data-testid="input-search"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger data-testid="select-skill-filter">
              <SelectValue placeholder="Filter by skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {skillOptions.map((skill) => (
                <SelectItem key={skill} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dayFilter} onValueChange={setDayFilter}>
            <SelectTrigger data-testid="select-day-filter">
              <SelectValue placeholder="Filter by day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {dayOptions.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Filter by location..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            data-testid="input-location-filter"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground" data-testid="text-count">
          Showing {filteredVolunteers.length} of {volunteers.length} volunteers
        </p>
      </div>

      <div className="grid gap-4">
        {filteredVolunteers.length > 0 ? (
          filteredVolunteers.map((volunteer: any) => (
            <Card key={volunteer.id} data-testid={`card-volunteer-${volunteer.id}`}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle>{volunteer.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a
                        href={`mailto:${volunteer.email}`}
                        className="hover:text-foreground"
                      >
                        {volunteer.email}
                      </a>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <Award className="h-3 w-3 mr-1" />
                    {experienceLabels[volunteer.experience_level]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{volunteer.location}</span>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {volunteer.skills.map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    Availability
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {volunteer.availability && volunteer.availability.length > 0
                      ? volunteer.availability.map((slot: any, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {slot.day} - {slot.time}
                          </span>
                        ))
                      : <span className="text-sm text-muted-foreground">No availability set</span>
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {volunteers.length === 0
                ? "No volunteers registered yet"
                : "No volunteers match your filters"}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
