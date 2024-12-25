import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { AppProvider, Clock, Timer, useDockStore } from "@repo/shared";

import {
  TodoListSheet,
  Background,
  BackgroundOverlay,
  BackgroundSelectorSheet,
  BreathePod,
  Greeting,
  AppLayout,
  Quote,
  SoundscapesSheet,
  // Timer,
  Dock,
} from "@repo/shared";

import "./style.css";


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
  const isTimerVisible = useDockStore((state) => state.isTimerVisible);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [cycleCount, setCycleCount] = useState(1);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_TIME" }, (response) => {
      setTimeLeft(response.timeLeft);
      setIsRunning(response.isRunning);
      setMode(response.mode);
      setCycleCount(response.cycleCount);
    });

    const interval = setInterval(() => {
      chrome.runtime.sendMessage({ type: "GET_TIME" }, (response) => {
        setTimeLeft(response.timeLeft);
        setIsRunning(response.isRunning);
        setMode(response.mode);
        setCycleCount(response.cycleCount);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const emoji = mode === "focus" ? "🎯" : "☕";
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    document.title = `#${cycleCount} ${mins}:${secs.toString().padStart(2, "0")} ${emoji}`;
  }, [timeLeft, mode, cycleCount]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative">
      <div className="flex h-6 w-full justify-center bg-zinc-900/20 backdrop-blur-md">
        {/* <Clock /> */}
      </div>

      <div className="flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-shadow-lg text-5xl sm:text-7xl md:text-9xl font-semibold tracking-tighter text-white/90">
          {formatTime(timeLeft)}
        </h1>
        
        <div className="flex gap-4">
          <button
            onClick={() => {
              chrome.runtime.sendMessage({
                type: isRunning ? "PAUSE_TIMER" : "START_TIMER"
              });
              setIsRunning(!isRunning);
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/90 backdrop-blur-md transition-colors"
          >
            {isRunning ? "Pause" : "Start"}
          </button>
        </div>

        <div className="text-white/70 text-sm">
          {mode === "focus" ? `Focus #${cycleCount} 🎯` : "Break Time ☕"}
        </div>
      </div>
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

