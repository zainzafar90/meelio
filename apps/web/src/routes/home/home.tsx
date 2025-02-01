import { useTranslation } from "react-i18next";

import { Clock, useDockStore } from "@repo/shared";
import { Background } from "@repo/shared";
import { BackgroundOverlay } from "@repo/shared";
import { BackgroundSelectorSheet } from "@repo/shared";
import { BreathePod } from "@repo/shared";
import { Greeting } from "@repo/shared";
import { AppLayout } from "@repo/shared";
import { Quote } from "@repo/shared";
import { SoundscapesSheet } from "@repo/shared";
import { TodoListSheet } from "@repo/shared";
import { Dock } from "@repo/shared";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WebTimer } from "@/components/web-timer";

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
  const [mode, setMode] = useState<"clock" | "timer">("clock");

  const handleClick = () => {
    setMode(mode === "clock" ? "timer" : "clock");
  };

  return (
    <motion.div
      onClick={handleClick}
      className="cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <AnimatePresence mode="wait">
        {mode === "clock" ? (
          <motion.div
            key="clock"
            className="flex flex-col items-center justify-center gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
              <Clock />
              <Greeting />
              <Quote />
          </motion.div>
        ) : (
          <motion.div
            key="timer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <WebTimer />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const BreathingContent = () => {
  return <BreathePod />;
};

const TopBar = () => {
  return (
    <div className="relative">
     

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
