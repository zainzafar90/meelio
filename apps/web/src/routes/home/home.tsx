import { useEffect, useState } from "react";

import NumberFlow from "@number-flow/react";
import { ListTodo } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
  <div className="col-span-3 row-span-3 flex flex-col items-center justify-center text-center text-white transition-all hover:text-white">
    <Clock />
    <Greeting />
    <Quote />
  </div>
);

const TopBar = () => {
  const { isTimerVisible } = useDockStore();

  if (!isTimerVisible) {
    return <div className="relative col-span-3 flex justify-between" />;
  }

  return (
    <div className="relative col-span-3 flex justify-between">
      <TimerDynamicIsland />
    </div>
  );
};

const BottomBar = () => (
  <div className="relative col-span-3 flex items-center justify-between">
    <div className="flex items-center justify-start">
      <SidebarTrigger />
    </div>
    <Dock />
    <div className="flex items-center justify-end">
      <Button
        variant="glass"
        size="icon"
        className="bg-black/10 backdrop-blur-md transition-colors hover:bg-black/20"
      >
        <ListTodo className="h-4 w-4 md:h-5 md:w-5" />
      </Button>
    </div>
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
