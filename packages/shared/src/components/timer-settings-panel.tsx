import { useState } from "react";

export interface TimerDurationValues {
  focusMin: number;
  breakMin: number;
}

export interface TimerSettingsValues {
  notifications: boolean;
  sounds: boolean;
  durations: TimerDurationValues;
}

interface TimerSettingsPanelProps {
  focusMin: number;
  breakMin: number;
  notifications: boolean;
  sounds: boolean;
  onSave: (values: TimerSettingsValues) => void;
  onCancel?: () => void;
  className?: string;
}

export const TimerSettingsPanel = ({
  focusMin,
  breakMin,
  notifications,
  sounds,
  onSave,
  onCancel,
  className = "",
}: TimerSettingsPanelProps) => {
  const [focus, setFocus] = useState(focusMin);
  const [brk, setBreak] = useState(breakMin);
  const [notifs, setNotifs] = useState(notifications);
  const [soundsEnabled, setSoundsEnabled] = useState(sounds);

  const handleSave = () => {
    onSave({
      durations: { focusMin: focus, breakMin: brk },
      notifications: notifs,
      sounds: soundsEnabled,
    });
  };

  return (
    <div className={`bg-white/10 backdrop-blur rounded-2xl p-4 space-y-4 ${className}`}>
      {/* Duration Settings */}
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">
          Timer Duration
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/60 mb-1 block">
              Focus (min)
            </label>
            <input
              type="number"
              className="w-full bg-white/10 backdrop-blur rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-white/20"
              value={focus}
              min={1}
              max={90}
              onChange={(e) => setFocus(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">
              Break (min)
            </label>
            <input
              type="number"
              className="w-full bg-white/10 backdrop-blur rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-white/20"
              value={brk}
              min={1}
              max={30}
              onChange={(e) => setBreak(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Notification & Sound Settings */}
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">
          Notifications & Sound
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Enable notifications</span>
            <button
              onClick={() => setNotifs(!notifs)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifs ? "bg-white/30" : "bg-white/10"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifs ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Enable sounds</span>
            <button
              onClick={() => setSoundsEnabled(!soundsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                soundsEnabled ? "bg-white/30" : "bg-white/10"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  soundsEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 bg-white/20 backdrop-blur rounded-lg px-4 py-2 text-white text-sm font-medium hover:bg-white/30 transition-colors"
        >
          Save Changes
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 bg-white/5 backdrop-blur rounded-lg px-4 py-2 text-white text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};