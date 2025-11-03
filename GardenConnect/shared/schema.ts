import { z } from "zod";

// Time slot type for grid-based availability
export const timeSlotSchema = z.object({
  day: z.string(),
  time: z.string(),
});

export type TimeSlot = z.infer<typeof timeSlotSchema>;

export const volunteerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  skills: z.array(z.string()).min(1, "Please select at least one skill"),
  availability: z.array(timeSlotSchema).min(1, "Please select at least one time slot"),
  location: z.string().min(1, "Location preference is required"),
  experience: z.enum(["new", "some", "experienced"]),
});

export type VolunteerFormData = z.infer<typeof volunteerFormSchema>;

export const gardenFormSchema = z.object({
  gardenName: z.string().min(1, "Garden name is required"),
  location: z.string().min(1, "Garden location is required"),
  contactEmail: z.string().email("Valid email is required"),
  skillsNeeded: z.array(z.string()).min(1, "Please select at least one skill needed"),
  needsSchedule: z.array(timeSlotSchema).min(1, "Please select at least one time slot"),
  notes: z.string().optional(),
});

export type GardenFormData = z.infer<typeof gardenFormSchema>;

export const skillOptions = [
  "Gardening/Planting",
  "Weeding",
  "Harvesting",
  "Tool Maintenance",
  "Event Support",
  "Community Outreach",
] as const;

export const dayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const timeOptions = [
  "Morning",
  "Afternoon",
  "Evening",
] as const;

export type Skill = typeof skillOptions[number];
export type Day = typeof dayOptions[number];
export type Time = typeof timeOptions[number];
