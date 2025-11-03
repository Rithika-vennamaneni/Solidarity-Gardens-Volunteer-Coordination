import React, { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface TimeSlot {
  day: string;
  time: string;
}

interface AvailabilityGridProps {
  value: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
  label?: string;
  description?: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES = ["Morning", "Afternoon", "Evening"];

export default function AvailabilityGrid({ 
  value, 
  onChange, 
  label = "Availability",
  description = "Select the specific day and time combinations when you're available"
}: AvailabilityGridProps) {
  // REMOVED internal state - use prop directly to avoid infinite loop
  // const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>(value || []);
  
  const selectedSlots = value || [];

  const isSlotSelected = (day: string, time: string): boolean => {
    return selectedSlots.some(slot => slot.day === day && slot.time === time);
  };

  const toggleSlot = useCallback((day: string, time: string) => {
    const isSelected = selectedSlots.some(slot => slot.day === day && slot.time === time);
    let newSlots: TimeSlot[];

    if (isSelected) {
      // Remove the slot
      newSlots = selectedSlots.filter(slot => !(slot.day === day && slot.time === time));
    } else {
      // Add the slot
      newSlots = [...selectedSlots, { day, time }];
    }

    // Only call onChange - parent controls the state
    onChange(newSlots);
  }, [selectedSlots, onChange]);

  const toggleAllForDay = useCallback((day: string) => {
    const allDaySlots = TIMES.map(time => ({ day, time }));
    const allSelected = allDaySlots.every(slot => 
      selectedSlots.some(s => s.day === slot.day && s.time === slot.time)
    );

    let newSlots: TimeSlot[];
    if (allSelected) {
      // Remove all slots for this day
      newSlots = selectedSlots.filter(slot => slot.day !== day);
    } else {
      // Add all slots for this day
      const slotsToAdd = allDaySlots.filter(slot => 
        !selectedSlots.some(s => s.day === slot.day && s.time === slot.time)
      );
      newSlots = [...selectedSlots, ...slotsToAdd];
    }

    // Only call onChange - parent controls the state
    onChange(newSlots);
  }, [selectedSlots, onChange]);

  const toggleAllForTime = useCallback((time: string) => {
    const allTimeSlots = DAYS.map(day => ({ day, time }));
    const allSelected = allTimeSlots.every(slot => 
      selectedSlots.some(s => s.day === slot.day && s.time === slot.time)
    );

    let newSlots: TimeSlot[];
    if (allSelected) {
      // Remove all slots for this time
      newSlots = selectedSlots.filter(slot => slot.time !== time);
    } else {
      // Add all slots for this time
      const slotsToAdd = allTimeSlots.filter(slot => 
        !selectedSlots.some(s => s.day === slot.day && s.time === slot.time)
      );
      newSlots = [...selectedSlots, ...slotsToAdd];
    }

    // Only call onChange - parent controls the state
    onChange(newSlots);
  }, [selectedSlots, onChange]);

  const getSelectedCount = () => selectedSlots.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>
          {description}
          {getSelectedCount() > 0 && (
            <span className="ml-2 font-semibold text-primary">
              ({getSelectedCount()} slot{getSelectedCount() !== 1 ? 's' : ''} selected)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-muted text-left font-semibold">Day / Time</th>
                {TIMES.map(time => (
                  <th key={time} className="border p-2 bg-muted text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-semibold">{time}</span>
                      <button
                        type="button"
                        onClick={() => toggleAllForTime(time)}
                        className="text-xs text-primary hover:underline"
                      >
                        Toggle All
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => (
                <tr key={day}>
                  <td className="border p-2 bg-muted font-medium">
                    <div className="flex items-center justify-between">
                      <span>{day}</span>
                      <button
                        type="button"
                        onClick={() => toggleAllForDay(day)}
                        className="text-xs text-primary hover:underline ml-2"
                      >
                        Toggle All
                      </button>
                    </div>
                  </td>
                  {TIMES.map(time => {
                    const isSelected = isSlotSelected(day, time);
                    return (
                      <td 
                        key={`${day}-${time}`} 
                        className={`border p-2 text-center ${
                          isSelected ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSlot(day, time)}
                            id={`slot-${day}-${time}`}
                            className="cursor-pointer"
                          />
                          <Label
                            htmlFor={`slot-${day}-${time}`}
                            className="sr-only"
                          >
                            {day} {time}
                          </Label>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary of selected slots */}
        {getSelectedCount() > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Selected Time Slots:</p>
            <div className="flex flex-wrap gap-2">
              {selectedSlots.map((slot, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-xs"
                >
                  {slot.day} - {slot.time}
                  <button
                    type="button"
                    onClick={() => toggleSlot(slot.day, slot.time)}
                    className="hover:text-destructive ml-1"
                    aria-label={`Remove ${slot.day} ${slot.time}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
