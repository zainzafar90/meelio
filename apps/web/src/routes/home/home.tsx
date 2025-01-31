import { useTranslation } from "react-i18next";
// import { useEffect } from "react";

import { Clock, useDockStore } from "@repo/shared";
import { Background } from "@repo/shared";
import { BackgroundOverlay } from "@repo/shared";
import { BackgroundSelectorSheet } from "@repo/shared";
import { BreathePod } from "@repo/shared";
import { Greeting } from "@repo/shared";
import { AppLayout } from "@repo/shared";
import { Quote } from "@repo/shared";
import { SoundscapesSheet } from "@repo/shared";
// import { Timer } from "@repo/shared";
import { TodoListSheet } from "@repo/shared";
import { Dock } from "@repo/shared";
import { useTimer } from '@repo/shared';
import { useEffect, useState } from "react";
import { webTimerService } from "../../services/timer.service";
const Home = () => {
  return (
    <>
      <Background />
      <BackgroundOverlay />
      <AppLayout>
        <TopBar />
        <Content />
        <BottomBar />
      </AppLayout>
    </>
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
      <Clock />
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
  const timer = useTimer(webTimerService);
  const [focusedMinutes, setFocusedMinutes] = useState(0);
  const [breakMinutes, setBreakMinutes] = useState(0);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const emoji = timer.mode === 'focus' ? '🎯' : '☕';
    const timeStr = formatTime(timer.timeLeft);
    document.title = timer.isRunning 
      ? `${focusedMinutes}:${breakMinutes} ${emoji} ${timeStr} - ${timer.mode === 'focus' ? 'Focus' : 'Break'}`
      : 'Serenity';
  }, [timer.timeLeft, timer.mode, timer.isRunning, focusedMinutes, breakMinutes]);

  useEffect(() => {
    if (timer.mode === 'focus') {
      setFocusedMinutes(prev => prev + 25);
    } else {
      setBreakMinutes(prev => prev + 5);
    }
  }, [timer.mode]);


  return (
    <div className="relative">
     

      {/* {isTimerVisible && <Timer />} */}

    <div className="flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-shadow-lg text-5xl sm:text-7xl md:text-9xl font-semibold tracking-tighter text-white/90">
          {formatTime(timer.timeLeft)}
        </h1>
        
        <div className="flex gap-4">
          {!timer.isRunning ? (
            <button
              onClick={() => timer.start()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/90 backdrop-blur-md transition-colors"
            >
              Start {timer.mode === 'focus' ? 'Focus' : 'Break'}
            </button>
          ) : (
            <button
              onClick={() => timer.pause()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/90 backdrop-blur-md transition-colors"
            >
              Pause
            </button>
          )}
          
          <button
            onClick={() => timer.reset()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/90 backdrop-blur-md transition-colors"
          >
            Reset
          </button>
          
          <button
            onClick={() => timer.setMode(timer.mode === 'focus' ? 'break' : 'focus')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/90 backdrop-blur-md transition-colors"
          >
            Switch to {timer.mode === 'focus' ? 'Break' : 'Focus'}
          </button>
        </div>
        <div className="text-white/70 text-sm">
          {timer.mode === 'focus' ? '🎯 Focus Time' : '☕ Break Time'}
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
