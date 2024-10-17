import { Timer } from "@/components/pomodoro/timer";
import { AppLayout } from "@/layouts/app-layout";

const Pomodoro = () => {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Timer />
      </div>
    </AppLayout>
  );
};

export default Pomodoro;
