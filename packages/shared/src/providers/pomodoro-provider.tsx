// import { TimerService } from "../services/timer.service";
import { useAuthStore } from "../stores/auth.store";
// import { usePomodoroTimer } from "../hooks/use-pomodoro-timer";

export const PomodoroProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuthStore();
  // usePomodoroTimer({ user });

  return <>{children}</>;
};
