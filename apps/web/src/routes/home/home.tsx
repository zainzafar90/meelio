import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useDockStore } from "@/stores/dock.store";

import { AppSidebar } from "./components/app-sidebar";
import { Background, BackgroundOverlay } from "./components/backgrounds";
import { BreathingControl } from "./components/breathing/breathing-control";
import { Clock } from "./components/clock/clock";
import { Dock } from "./components/dock";
import { Greeting } from "./components/greetings/greetings";
import { AppLayout } from "./components/layout";
import { Quote } from "./components/quote/quote";
import { TimerDynamicIsland } from "./components/timer-dynamic-island";

export const Home = () => {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <Background />
        <BackgroundOverlay />
        <AppLayout>
          <TopBar />
          <BreathingControl />
          <BottomBar />
        </AppLayout>
      </SidebarInset>
    </SidebarProvider>
  );
};

const MainContent = () => (
  <div className="flex flex-col items-center justify-center text-center text-white transition-all hover:text-white">
    <Greeting />
    <Quote />
  </div>
);

const TopBar = () => {
  const { isTimerVisible } = useDockStore();

  const MenuBar = () => (
    <div className="relative">
      <div className="flex h-6 w-full justify-center bg-black/5 backdrop-blur-md">
        <Clock />
      </div>

      {isTimerVisible && <TimerDynamicIsland />}
    </div>
  );

  return <MenuBar />;
};

const BottomBar = () => (
  <div className="relative flex items-center justify-between">
    <div className="flex items-center justify-start" />
    <Dock />
    <div className="flex items-center justify-end" />
  </div>
);
