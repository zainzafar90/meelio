import { useEffect } from "react";
import { soundSyncService } from "../../../services/sound-sync.service";

export const SoundSyncInitializer = () => {
  useEffect(() => {

    const startSync = async () => {
      try {
        await soundSyncService.startSync({
          onProgress: (progress) => {
            console.debug(
              `Sound sync progress: ${progress.downloaded}/${progress.total}`
            );
          },
          onComplete: () => {
            console.debug("Sound sync complete!");
          },
          onError: (error) => {
            console.error("Sound sync error:", error);
          },
        });
      } catch (error) {
        console.error("Failed to start sound sync:", error);
      }
    };

    startSync();

    const handleOnline = () => {
      if (navigator.onLine) {
        startSync();
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
};