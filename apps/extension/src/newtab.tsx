import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";

import {
  AppLayout,
  AppProvider,
  Background,
  BackgroundSelectorSheet,
  BookmarksSheet,
  BreathePod,
  CalendarDynamicIsland,
  CalendarSheet,
  Clock,
  Dock,
  Greeting,
  NotesSheet,
  Quote,
  SearchPopover,
  ShortcutsModal,
  SimpleTimer,
  SiteBlockerSheet,
  SoundscapesSheet,
  TabStashSheet,
  TaskListSheet,
  useAppStore,
  useBookmarksStore,
  useDockStore,
} from "@repo/shared";
import { BookmarksDynamicIsland } from "@repo/shared/src/components/core/bookmarks/bookmarks-dynamic-island";

import "./style.css";

const Home = () => {
  const { checkPermissions, initializeStore } = useBookmarksStore(
    useShallow((state) => ({
      checkPermissions: state.checkPermissions,
      initializeStore: state.initializeStore,
    }))
  );

  useEffect(() => {
    async function initializeBookmarks(): Promise<void> {
      const hasPerms = await checkPermissions();
      if (hasPerms) {
        await initializeStore();
      }
    }
    initializeBookmarks();
  }, [checkPermissions, initializeStore]);

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
}

const Content = () => {
  const { t } = useTranslation();
  const { isBreathingVisible, isGreetingsVisible, isTimerVisible } = useDockStore(
    useShallow((state) => ({
      isBreathingVisible: state.isBreathingVisible,
      isGreetingsVisible: state.isGreetingsVisible,
      isTimerVisible: state.isTimerVisible,
    }))
  );

  const showGreetings = isGreetingsVisible || isTimerVisible;

  return (
    <main
      className="flex flex-1 flex-col items-center justify-center"
      aria-label={t("home.layout.main.aria")}
    >
      {showGreetings && <GreetingsContent />}
      {isBreathingVisible && <BreathePod />}
      <SoundscapesSheet />
      <TaskListSheet />
      <NotesSheet />
      <BackgroundSelectorSheet />
      <SiteBlockerSheet />
      <TabStashSheet />
      <BookmarksSheet />
      <CalendarSheet />
      <ShortcutsModal />
    </main>
  );
}

const fadeSlideAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const GreetingsContent = () => {
  const isTimerVisible = useDockStore(useShallow((state) => state.isTimerVisible));

  return (
    <motion.div>
      <AnimatePresence mode="wait">
        {isTimerVisible ? (
          <motion.div key="timer" {...fadeSlideAnimation}>
            <SimpleTimer />
          </motion.div>
        ) : (
          <motion.div
            key="clock"
            className="flex flex-col items-center justify-center gap-8"
            {...fadeSlideAnimation}
          >
            <Clock />
            <Greeting />
            <Quote />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const TopBar = () => {
  return (
    <div className="relative flex justify-center pt-0">
      <CalendarDynamicIsland />
      <BookmarksDynamicIsland />
      <SearchPopover />
    </div>
  );
}

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
}

export const NewTab = () => {
 useAppStore.getState().setPlatform("extension");

  return (
    <AppProvider>
      <Home />
    </AppProvider>
  );
}

export default NewTab;
