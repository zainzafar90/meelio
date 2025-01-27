import ReactPlayer from "react-player";
import { usePomodoroTimer } from "../hooks/use-pomodoro-timer";
import { useAuthStore } from "../stores/auth.store";
import { emptySoundUrl } from "../data/sounds-data";

export const PomodoroProvider = ({
  children,
  worker,
}: {
  children: React.ReactNode;
  worker: Worker;
}) => {
  const { user } = useAuthStore();
  usePomodoroTimer({ user, worker });

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
