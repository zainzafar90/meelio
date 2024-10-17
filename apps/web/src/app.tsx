import { AppProvider } from "@/providers/app-provider";

import { Router } from "@/routes/router";

export const App = () => {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
};
