import React from "react";

import { useTranslation } from "react-i18next";

import { useDockStore } from "@/stores/dock.store";

import { Background } from "./routes/home/components/backgrounds/backgrounds";
import { BackgroundSelectorSheet } from "./routes/home/components/backgrounds/components/background-selector.sheet";
import { BackgroundOverlay } from "./routes/home/components/backgrounds/components/background-overlay";
import { AppLayout } from "./routes/home/components/layout";
import { SoundscapesSheet } from "./routes/home/components/soundscapes/soundscapes.sheet";
import { TodoListSheet } from "./routes/home/components/todo-list/components/todo-list.sheet";
import { Greeting } from "./routes/home/components/greetings/greetings-mantras";
import { Quote } from "./routes/home/components/quote/quote";
import { BreathePod } from "./routes/home/components/breathing-pod/breathing-pod";
import { Timer } from "./routes/home/components/timer/timer";
import { Dock } from "./routes/home/components/dock/dock";
import { AppProvider } from "./providers/app-provider";

import "./style.css";
import { Clock } from "./routes/home/components/clock/clock";

const Home = () => {
  return (
    <AppProvider>
      <Background />
      <BackgroundOverlay />
      <AppLayout>
        <TopBar />
        <Content />
        <BottomBar />
      </AppLayout>
    </AppProvider>
  );
};

const Content = () => {
  const { isBreathingVisible, isGreetingsVisible } = useDockStore((state) => ({
    isBreathingVisible: state.isBreathingVisible,
    isGreetingsVisible: state.isGreetingsVisible,
  }));
  const { t } = useTranslation();

  return (
    <main
      className="flex flex-1 flex-col items-center justify-center"
      aria-label={t("home.layout.main.aria")}
    >
      {isGreetingsVisible && <GreetingsContent />}
      {isBreathingVisible && <BreathingContent />}
      <SoundscapesSheet />
      <TodoListSheet />
      <BackgroundSelectorSheet />
    </main>
  );
};

const GreetingsContent = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <Greeting />
      <Quote />
    </div>
  );
};

const BreathingContent = () => {
  return <BreathePod />;
};

const TopBar = () => {
  const isTimerVisible = useDockStore((state) => {
    return state.isTimerVisible;
  });

  return (
    <div className="relative">
          <div className="flex h-6 w-full justify-center bg-zinc-900/20 backdrop-blur-md">
            <Clock />
          </div>

      {isTimerVisible && <Timer />}
    </div>
  );
};

const BottomBar = () => {
  const { t } = useTranslation();
  return (
    <footer
      className="flex items-center justify-center pb-2"
      aria-label={t("home.layout.footer.aria")}
    >
      <Dock />
    </footer>
  );
};

export default Home;

