import { useEffect } from "react";

import { useBackgroundStore } from "../stores/background.store";

export const BackgroundProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const initializeWallpapers = useBackgroundStore(
    (state) => state.initializeWallpapers
  );
  useEffect(() => {
    initializeWallpapers();
  }, []);

  return <>{children}</>;
};
