import { useEffect, useState } from "react";

import NumberFlow from "@number-flow/react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useDockStore } from "@/stores/dock.store";

import { AppSidebar } from "./components/app-sidebar";
import { Background, BackgroundOverlay } from "./components/backgrounds";
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
          <MainContent />
          <BottomBar />
        </AppLayout>
      </SidebarInset>
    </SidebarProvider>
  );
};

const MainContent = () => (
  <div className="flex flex-col items-center justify-center text-center text-white transition-all hover:text-white">
    <Clock />
    <Greeting />
    <Quote />
  </div>
);

const TopBar = () => {
  const { isTimerVisible } = useDockStore();

  if (!isTimerVisible) {
    return <div className="relative flex w-full justify-center" />;
  }

  return (
    <div className="relative flex w-full justify-center">
      <TimerDynamicIsland />
    </div>
  );
};

const BottomBar = () => (
  <div className="relative flex items-center justify-between">
    <div className="flex items-center justify-start" />
    <Dock />
    <div className="flex items-center justify-end" />
  </div>
);

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col">
      <h1 className="text-shadow-lg font-mono text-5xl font-semibold leading-none tracking-tight text-white sm:text-7xl md:text-9xl lg:text-[10rem]">
        <NumberFlow
          value={time.getHours()}
          format={{ notation: "standard", minimumIntegerDigits: 2 }}
          locales="en-US"
        />
        <span className="text-white">:</span>
        <NumberFlow
          value={time.getMinutes()}
          format={{ notation: "standard", minimumIntegerDigits: 2 }}
          locales="en-US"
        />
      </h1>
    </div>
  );
};
