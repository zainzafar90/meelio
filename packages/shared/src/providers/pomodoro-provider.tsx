import { TimerService } from "../services/timer.service";
import ReactPlayer from "react-player";
import { useAuthStore } from "../stores/auth.store";
import { emptySoundUrl } from "../data/sounds-data";
import { usePomodoroTimer } from "../hooks/use-pomodoro-timer";

export const PomodoroProvider: React.FC<{
  children: React.ReactNode;
  timerService: TimerService;
}> = ({ children, timerService }) => {
  const { user } = useAuthStore();
  usePomodoroTimer({ user, timerService });

  return (
    <>
      {children}

      {/* Empty sound to keep the timer running when browser is in background */}
      <ReactPlayer
        url={emptySoundUrl}
        playing={true}
        loop={true}
        muted={true}
        volume={0}
        width={0}
        height={0}
      />
    </>
  );
};
