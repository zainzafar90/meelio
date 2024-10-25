import React, { useMemo, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "@/components/world-clock/clock";
import timezones from "@/components/world-clock/timezones-simplified.json";
import { AppLayout } from "@/layouts/app-layout";

const getLocalTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const WorldClock: React.FC = () => {
  const localTimezone = useMemo(() => {
    return getLocalTimezone();
  }, []);
  const [clocks, setClocks] = useState<string[]>([
    localTimezone,
    "America/Toronto",
  ]);
  const [selectedTimezone, setSelectedTimezone] =
    useState<string>(localTimezone);

  const addClock = () => {
    if (clocks.length < 3) {
      const timezone = timezones.find((tz) => tz === selectedTimezone);
      if (timezone) {
        const timezoneAlreadyInClocks = clocks.some((tz) => tz === timezone);
        if (timezoneAlreadyInClocks) {
          toast.warning("Duplicate Clock", {
            description: "This timezone is already in the clocks.",
          });
          return;
        }

        setClocks([...clocks, timezone]);
      }
      setSelectedTimezone(localTimezone);
    }
  };

  return (
    <AppLayout>
      <div
        className="min-h-screen bg-cover bg-center p-6"
        style={{
          backgroundImage: "url('./img/bg-01.webp')",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {clocks.map((timezone, index) => (
            <Clock
              key={index}
              timezone={timezone}
              isLocalTimezone={timezone === localTimezone}
            />
          ))}
        </div>
        {clocks.length < 4 && (
          <div className="flex items-center space-x-2">
            <Select
              value={selectedTimezone}
              onValueChange={setSelectedTimezone}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={addClock}>Add Clock</Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
