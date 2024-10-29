import { useEffect, useState } from "react";

import { ListTodo } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/auth.store";

import { AppSidebar } from "./components/app-sidebar";
import { Background, BackgroundOverlay } from "./components/backgrounds";
import { Dock } from "./components/dock";
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
  <div className="col-span-3 row-span-3 flex flex-col items-center justify-center text-center text-white/90 hover:text-white transition-all">
    <Clock />
    <Greeting />
    <Quote />
  </div>
);

const TopBar = () => (
  <div className="relative flex justify-between col-span-3">
    <SidebarTrigger />
    <TimerDynamicIsland />

    <div className="flex items-center justify-end">
      <Button variant="glass" size="icon">
        <ListTodo className="w-4 h-4 md:w-5 md:h-5" />
      </Button>
    </div>
  </div>
);

const BottomBar = () => (
  <div className="flex justify-center col-span-3">
    <Dock />
  </div>
);

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <h1 className="text-5xl sm:text-7xl md:text-9xl lg:text-[10rem] font-semibold leading-none tracking-tight text-shadow-lg mb-2">
      {time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
      })}
    </h1>
  );
};

const Greeting = () => {
  const [greeting, setGreeting] = useState("");
  const [time] = useState(new Date());
  const { user } = useAuthStore();

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
    <h2 className="text-xl sm:text-2xl md:text-4xl font-medium mt-2 mb-4 md:mb-8 lg:mb-16 text-shadow-lg">
      {greeting}
      {getFirstName()}
    </h2>
  );
};

const Quote = () => (
  <div className="glass px-4 py-3 lg:px-8 lg:py-6 rounded-lg max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 leading-relaxed">
      Your life is designed to get the results you are getting right now.
      Whether you realize it or not, you are the architect &mdash; Jim Rohn
    </p>
  </div>
);
