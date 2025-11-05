import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";

import {
  AppProvider,
  AuthContainer,
  Clock,
  TabStashSheet,
  BookmarksSheet,
  WeatherSheet,
  CalendarSheet,
  useAuthStore,
  useDockStore,
  TaskListSheet,
  Background,
  BackgroundSelectorSheet,
  BreathePod,
  Greeting,
  AppLayout,
  Quote,
  SoundscapesSheet,
  Dock,
  SiteBlockerSheet,
  NotesSheet,
  SimpleTimer,
  SearchPopover,
  AppLauncher
 } from "@repo/shared";
 import {CalendarDynamicIsland} from "@repo/shared";
import { useAppStore } from "@repo/shared";

import "./style.css";

const Home = () => {
  const { user, guestUser } = useAuthStore(useShallow((state) => ({
    user: state.user,
    guestUser: state.guestUser,
  })));


  if (!user && !guestUser) {
    return (
      <>
        <Background />
        <AuthContainer />
      </>
    );
  }

  return (
    <>
      <Background />
      <AppLayout>
        <TopBar />
        <Content />
        <BottomBar />
      </AppLayout>
    </>
  );
};

const Content = () => {
  const { t } = useTranslation();
  const { isBreathingVisible, isGreetingsVisible, isTimerVisible } = useDockStore(useShallow((state) => ({
    isBreathingVisible: state.isBreathingVisible,
    isGreetingsVisible: state.isGreetingsVisible,
    isTimerVisible: state.isTimerVisible,
  })));

  return (
    <main
      className="flex flex-1 flex-col items-center justify-center"
      aria-label={t("home.layout.main.aria")}
    >
      {(isGreetingsVisible || isTimerVisible) && <GreetingsContent />}
      {isBreathingVisible && <BreathingContent />}
      <AppLauncher />
      <SoundscapesSheet />
      <TaskListSheet />
      <NotesSheet />
      <BackgroundSelectorSheet />
      <SiteBlockerSheet />
      <TabStashSheet />
      <BookmarksSheet />
      <WeatherSheet />
      <CalendarSheet />
    </main>
  );
};

const GreetingsContent = () => {
  const isTimerVisible = useDockStore(
    useShallow((state) => state.isTimerVisible),
  );

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
            <SimpleTimer />
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
    <div className="relative flex justify-center pt-0">
      <CalendarDynamicIsland />
      <SearchPopover />
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

export const NewTab = () => {
  useAppStore.getState().setPlatform("extension");

  return (
    <AppProvider>
      <Home />
    </AppProvider>
  );
};

export default NewTab;
