import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { useTranslation } from "react-i18next";

import { AppProvider, Clock, TabStashSheet, useDockStore } from "@repo/shared";

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
  Dock,
  SiteBlockerSheet
} from "@repo/shared";

import { ExtensionTimer } from "./components/extension-timer";

import "./style.css";

const Home = () => {

  return (
    <AppProvider platform="extension">
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
  const { t } = useTranslation();
  const { isBreathingVisible, isGreetingsVisible } = useDockStore((state) => ({
    isBreathingVisible: state.isBreathingVisible,
    isGreetingsVisible: state.isGreetingsVisible,
  }));

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
      <SiteBlockerSheet />
      <TabStashSheet />
    </main>
  );
};

const GreetingsContent = () => {
  const isTimerVisible = useDockStore((state) => state.isTimerVisible);

  return (
    <motion.div>
      <AnimatePresence mode="wait">
        {isTimerVisible ? (
          <motion.div
            key="timer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ExtensionTimer />
          </motion.div>
        ) : (
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
    <div className="relative" />
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

