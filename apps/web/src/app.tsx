

import { Router } from "@/routes/router";
import { AppProvider } from "@repo/shared";

export const App = () => {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
};
