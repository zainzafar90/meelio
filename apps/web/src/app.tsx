

import { Router } from "@/routes/router";
import { AppProvider } from "@repo/shared";
import Worker from "@/workers/web-timer.worker?worker";


export const App = () => {
  const worker = new Worker();
  return (
    <AppProvider worker={worker}>
      <Router />
    </AppProvider>
  );
};
