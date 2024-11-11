import { ReactNode, useEffect, useState } from "react";

import NumberFlow from "@number-flow/react";
import { ListTodo } from "lucide-react";

import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/auth.store";
import { useDockStore } from "@/stores/dock.store";

import { AppSidebar } from "./components/app-sidebar";
import { Background, BackgroundOverlay } from "./components/backgrounds";
import { AppLayout } from "./components/layout";
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
    <Dock2 />
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
    <h1 className="text-shadow-lg mb-2 font-mono text-5xl font-semibold leading-none tracking-tight text-white sm:text-7xl md:text-9xl lg:text-[10rem]">
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
  );
};

const Greeting = () => {
  const [greeting, setGreeting] = useState("");
  const [time, setTime] = useState(new Date());
  const { user } = useAuthStore();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = time.getHours();
      if (hour >= 4 && hour < 12)
        setGreeting("☕ Good morning"); // 04:00 AM  - 11:59 AM
      else if (hour >= 12 && hour < 17)
        setGreeting("🌤️ Good afternoon"); // 12:00 PM  - 04:59 PM
      else if (hour >= 17 && hour < 21)
        setGreeting("🌿 Good evening"); // 05:00 PM  - 08:59 PM
      else setGreeting("🌙 Good night"); // 09:00 PM  - 03:59 AM
    };

    updateGreeting();
  }, [time]);

  const getFirstName = () => {
    if (!user || !user.name) return "";
    return ` — ${user.name.split(" ")[0]}`;
  };

  return (
    <h2 className="text-shadow-lg mb-4 mt-2 text-xl font-medium sm:text-2xl md:mb-8 md:text-4xl lg:mb-16">
      {greeting}
      {getFirstName()}
    </h2>
  );
};

const Quote = () => (
  <div className="mx-auto max-w-xs rounded-lg border border-white/10 bg-gray-900/5 px-4 py-3 backdrop-blur-lg sm:max-w-sm md:max-w-md lg:max-w-lg lg:px-8 lg:py-6">
    <p className="text-sm leading-relaxed sm:text-base md:text-lg lg:text-xl">
      Your life is designed to get the results you are getting right now.
      Whether you realize it or not, you are the architect &mdash; Jim Rohn
    </p>
  </div>
);

export const Dock2 = () => {
  const apps = [
    {
      id: 1,
      icon: <Icons.breathing className="size-6 border-blue-400 text-white" />,
      name: "Breathepod",
      bgColor: "bg-gradient-to-b from-zinc-800 to-zinc-900",
    },
    {
      id: 2,
      icon: <Icons.soundscapes className="size-6 text-white" />,
      name: "Soundscapes",
      bgColor: "bg-gradient-to-b from-zinc-800 to-zinc-900",
    },
  ];

  const systemApps = [
    {
      id: 5,
      icon: <Icons.settings className="size-6 text-zinc-200" />,
      name: "Settings",
      bgColor: "bg-gradient-to-b from-zinc-800 to-zinc-900",
    },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/10 p-3 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-2">
        {/* Left apps */}
        <div className="flex items-center gap-2 pr-1">
          {apps.map((app) => (
            <DockIcon
              key={app.id}
              icon={app.icon}
              bgColor={app.bgColor}
              alt={app.name}
            />
          ))}

          <PomodoroCard />
        </div>

        {/* Right apps */}
        <div className="flex items-center gap-2 border-l border-white/10 pl-3">
          {systemApps.map((app) => (
            <DockIcon
              key={app.id}
              icon={app.icon}
              bgColor={app.bgColor}
              alt={app.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface DockIconProps {
  icon: ReactNode;
  alt: string;
  bgColor: string;
}

export function DockIcon({ icon, alt, bgColor }: DockIconProps) {
  return (
    <div className="group relative flex items-center justify-center">
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-xl shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:scale-105",
          bgColor
        )}
        title={alt}
      >
        {icon}
      </div>
    </div>
  );
}

export function PomodoroCard() {
  return (
    <DockIcon
      alt="Pomodoro"
      icon={<Icons.worldClock className="size-6 text-white" />}
      bgColor="bg-gradient-to-b from-zinc-800 to-zinc-900 hover:from-indigo-500 hover:to-indigo-600"
    />
  );
}
