import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gardenFormSchema, type GardenFormData, type TimeSlot, skillOptions } from "@shared/schema";
import AvailabilityGrid from "@/components/AvailabilityGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, MapPin, Mail } from "lucide-react";
import { createGarden, getAllGardens, deleteGarden } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gardens'] });
      toast({
        title: "Garden Posted",
        description: `${data.garden.garden_name} has been added successfully.`,
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
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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
      needsSchedule: [],
      notes: "",
    },
  });

  const onSubmit = (data: GardenFormData) => {
    createMutation.mutate(data);
  };

  const handleDelete = (gardenId: number) => {
    deleteMutation.mutate(gardenId);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Post New Garden Opportunity</CardTitle>
            <CardDescription>Add a garden that needs volunteers</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="gardenName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Garden Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., West Side Community Garden" data-testid="input-garden-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., West Urbana" data-testid="input-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="garden@example.com" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skillsNeeded"
                  render={() => (
                    <FormItem>
                      <FormLabel>Skills Needed</FormLabel>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {skillOptions.map((skill) => (
                          <FormField
                            key={skill}
                            control={form.control}
                            name="skillsNeeded"
                            render={({ field }) => (
                              <FormItem className="flex items-start space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(skill)}
                                    onCheckedChange={(checked) => {
                                      const newValue = checked
                                        ? [...(field.value || []), skill]
                                        : field.value?.filter((v) => v !== skill) || [];
                                      field.onChange(newValue);
                                    }}
                                    data-testid={`checkbox-skill-${skill.toLowerCase().replace(/[/\s]/g, '-')}`}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal cursor-pointer">
                                  {skill}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="needsSchedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <AvailabilityGrid
                          value={field.value}
                          onChange={field.onChange}
                          label="When do you need volunteers?"
                          description="Select the specific day and time combinations when you need help"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Any special requirements or additional information..." 
                          rows={3}
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" data-testid="button-submit">
                  Post Garden Opportunity
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Posted Gardens ({gardens.length})</CardTitle>
            <CardDescription>All current garden opportunities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {gardens.length > 0 ? (
              gardens.map((garden: any) => (
                <Card key={garden.id} data-testid={`card-garden-${garden.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{garden.garden_name}</CardTitle>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {garden.location}
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {garden.contact_email}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(garden.id)}
                        data-testid={`button-delete-${garden.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Skills Needed</p>
                      <div className="flex flex-wrap gap-1">
                        {garden.skills_needed.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground mb-1 text-xs">Schedule Needed</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {garden.needs_schedule && garden.needs_schedule.length > 0 
                          ? garden.needs_schedule.map((slot: any, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                {slot.day} - {slot.time}
                              </span>
                            ))
                          : <span className="text-xs text-muted-foreground">No schedule set</span>
                        }
                      </div>
                    </div>
                    {garden.additional_notes && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                        <p className="text-xs">{garden.additional_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No gardens posted yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
