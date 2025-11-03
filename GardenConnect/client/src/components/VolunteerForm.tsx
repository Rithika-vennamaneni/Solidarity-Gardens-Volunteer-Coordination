import { createVolunteer } from "@/lib/api";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { volunteerFormSchema, type VolunteerFormData, type TimeSlot, skillOptions } from "@shared/schema";
import AvailabilityGrid from "@/components/AvailabilityGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { temporaryStorage } from "@/lib/storage";

export default function VolunteerForm() {
  const [, setLocation] = useLocation();

  const form = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      skills: [],
      availability: [],
      location: "",
      experience: "new",
    },
  });

  const onSubmit = async (data: VolunteerFormData) => {
  try {
    await createVolunteer({
      name: data.name,
      email: data.email,
      skills: data.skills,
      availability: data.availability,
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

  return (
    <div className="min-h-screen py-12 sm:py-16 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold" data-testid="text-form-title">
              Volunteer Sign-Up
            </h1>
            <p className="text-muted-foreground" data-testid="text-form-subtitle">
              Tell us about your skills and availability
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium uppercase tracking-wide">
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Your full name"
                        className="h-12"
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium uppercase tracking-wide">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="your.email@example.com"
                        className="h-12"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skills"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium uppercase tracking-wide">
                      Skills
                    </FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                      {skillOptions.map((skill) => (
                        <FormField
                          key={skill}
                          control={form.control}
                          name="skills"
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
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <AvailabilityGrid
                        value={field.value}
                        onChange={field.onChange}
                        label="When are you available?"
                        description="Select the specific day and time combinations when you can volunteer"
                      />
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
                    <FormLabel className="text-sm font-medium uppercase tracking-wide">
                      Location Preference
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Near campus, West Urbana, Downtown Champaign"
                        className="h-12"
                        data-testid="input-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium uppercase tracking-wide">
                      Experience Level
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12" data-testid="select-experience">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New to Gardening</SelectItem>
                        <SelectItem value="some">Some Experience</SelectItem>
                        <SelectItem value="experienced">Experienced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto sm:px-12"
                  data-testid="button-submit"
                >
                  Find Matching Gardens
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
