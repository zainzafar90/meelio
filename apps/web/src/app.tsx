import { Router } from "@/routes/router";
import { AppProvider } from "@repo/shared";
import { useAppStore } from "../../../packages/shared/src/stores/app.store";

export const App = () => {
  useAppStore.getState().setPlatform("web");

  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
};
