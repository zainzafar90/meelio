import { Router } from "@/routes/router";
import { AppProvider, TimerService } from "@repo/shared";
import Worker from "@/workers/web-timer.worker?worker";

export const App = () => {
  const worker = new Worker();
  const timerService = new TimerService("web", worker);

  return (
    <AppProvider timerService={timerService}>
      <Router />
    </AppProvider>
  );
};
