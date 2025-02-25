import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { useAuthStore } from "../../../../stores/auth.store";
import { useBackgrounds, useSelectedBackground } from "../../../../lib/hooks";

export const Background = () => {
  const { user } = useAuthStore();
  const { data: backgrounds, isLoading: isLoadingBackgrounds } = useBackgrounds(
    user?.id || ""
  );
  const { data: selectedBackground } = useSelectedBackground();
  const [currentBackground, setCurrentBackground] = useState<any | null>(null);

  useEffect(() => {
    // First try to use the selected background from IndexedDB
    if (selectedBackground) {
      setCurrentBackground(selectedBackground);
      return;
    }

    // If no selected background, use the first available one
    if (backgrounds?.length) {
      setCurrentBackground(backgrounds[0]);
    }
  }, [backgrounds, selectedBackground]);

  if (!currentBackground) {
    return null;
  }

  return (
    <div className="fixed inset-0 -z-10">
      {currentBackground.type === "live" ? (
        <ReactPlayer
          url={currentBackground.url}
          playing
          loop
          muted
          width="100%"
          height="100%"
          style={{ objectFit: "cover" }}
        />
      ) : (
        <img
          src={currentBackground.url}
          alt={currentBackground.metadata?.name || "Background"}
          className="h-full w-full object-cover"
          loading="eager"
        />
      )}
    </div>
  );
};
