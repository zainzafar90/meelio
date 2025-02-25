import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { useAuthStore } from "../../../../stores/auth.store";
import { useBackgrounds } from "../../../../lib/hooks/useBackgrounds";

export const Background = () => {
  const { user } = useAuthStore();
  const { data: backgrounds } = useBackgrounds(user?.id || "");
  const [currentBackground, setCurrentBackground] = useState<
    (typeof backgrounds)[0] | null
  >(null);

  useEffect(() => {
    if (backgrounds?.length) {
      const favoriteBackground = backgrounds.find((bg) => bg.isFavorite);
      if (favoriteBackground) {
        setCurrentBackground(favoriteBackground);
      } else {
        setCurrentBackground(backgrounds[0]);
      }
    }
  }, [backgrounds]);

  if (!currentBackground) {
    return null;
  }

  return (
    <div className="fixed inset-0 -z-10">
      {currentBackground.type === "video" ? (
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
          alt={currentBackground.name}
          className="h-full w-full object-cover"
          loading="eager"
        />
      )}
    </div>
  );
};
