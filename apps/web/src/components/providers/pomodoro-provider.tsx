import { useEffect } from "react";

import { usePomodoroTimer } from "@/hooks/use-pomodoro-timer";
import { useAuthStore } from "@/stores/auth.store";

export const PomodoroProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuthStore();
  usePomodoroTimer({ user });

  return <>{children}</>;
};
