import React from "react";

import { cn } from "@/lib/utils";

import {
  BREATHING_PATTERNS,
  useBreathingStore,
} from "../store/breathing.store";

export const BreathingPatternSelector: React.FC = () => {
  const { selectedPattern, setSelectedPattern } = useBreathingStore();

  return (
    <div className="fixed bottom-32 left-0 right-0 flex items-center justify-center gap-4">
      {BREATHING_PATTERNS.map((pattern) => (
        <button
          key={pattern.name}
          onClick={() => setSelectedPattern(pattern)}
          className={cn(
            "rounded-lg px-6 py-3 transition-colors",
            selectedPattern.name === pattern.name
              ? "bg-white/20 text-white"
              : "bg-white/10 text-white/60 hover:bg-white/15"
          )}
        >
          <div className="text-left">
            <div className="font-semibold">{pattern.name}</div>
            <div className="text-sm opacity-80">{pattern.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
};
