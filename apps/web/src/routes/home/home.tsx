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
import { useAuthStore } from "@/stores/auth.store";
import { useDockStore } from "@/stores/dock.store";

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

const Greeting = () => {
  const [greeting, setGreeting] = useState("");
  const [time, setTime] = useState(new Date());
  const { user } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = time.getHours();
      if (hour >= 4 && hour < 12) setGreeting(t("home.greetings.morning"));
      else if (hour >= 12 && hour < 17)
        setGreeting(t("home.greetings.afternoon"));
      else if (hour >= 17 && hour < 21)
        setGreeting(t("home.greetings.evening"));
      else setGreeting(t("home.greetings.night"));
    };

    updateGreeting();
  }, [time, t]);

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

const Quote = () => {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-xs rounded-lg border border-white/10 bg-gray-900/5 px-4 py-3 backdrop-blur-lg sm:max-w-sm md:max-w-md lg:max-w-lg lg:px-8 lg:py-6">
      <p className="text-sm leading-relaxed sm:text-base md:text-lg lg:text-xl">
        {t("home.quote.text")}
        &mdash; {t("home.quote.author")}
      </p>
    </div>
  );
};
