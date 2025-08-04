import { useEffect, useState } from "react";
import {
  soundSyncService,
  SoundSyncProgress,
} from "../../../services/sound-sync.service";

export interface UseSoundSyncProgressResult extends SoundSyncProgress {}

/**
 * Track sound sync progress.
 * @returns current sync progress
 */
export const useSoundSyncProgress = (): UseSoundSyncProgressResult => {
  const [progress, setProgress] = useState<SoundSyncProgress>({
    total: 0,
    downloaded: 0,
    isComplete: false,
  });

  useEffect(() => {
    const update = () => setProgress(soundSyncService.getSyncStatus());
    update();
    const id = setInterval(update, 2000);
    return () => clearInterval(id);
  }, []);

  return progress;
};
