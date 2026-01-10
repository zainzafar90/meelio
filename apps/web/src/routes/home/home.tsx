import { useTranslation } from "react-i18next";
import { useEffect } from "react";

import {
  Clock,
  TabStashSheet,
  BookmarksSheet,
  CalendarSheet,
  CalendarDynamicIsland,
  SearchPopover,
  useDockStore,
  useAuthStore,
} from "@repo/shared";
import { Background } from "@repo/shared";
import { BackgroundSelectorSheet } from "@repo/shared";
import { BreathePod } from "@repo/shared";
import { Greeting } from "@repo/shared";
import { AppLayout } from "@repo/shared";
import { Quote } from "@repo/shared";
import { SoundscapesSheet } from "@repo/shared";
import { TaskListSheet } from "@repo/shared";
import { Dock } from "@repo/shared";
import { NotesSheet, ShortcutsModal } from "@repo/shared";
import { AuthContainer } from "@repo/shared";
import { PageSkeleton } from "@repo/shared";
import { AnimatePresence, motion } from "framer-motion";
import { WebTimer } from "@/components/web.timer";
import { SiteBlockerSheet } from "@repo/shared";
import { useShallow } from "zustand/shallow";

const Home = () => {
  const { user, guestUser, loading } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      guestUser: state.guestUser,
      loading: state.loading,
    })),
  );
  const { t } = useTranslation();

  if (loading) {
    return (
      <>
        <Background />

        <PageSkeleton>
          <h3 className="text-foreground font-medium">
            {t("common.loading")}
          </h3>
        </PageSkeleton>
      </>
    );
  }

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
  const { isBreathingVisible, isGreetingsVisible, isTimerVisible } =
    useDockStore(
      useShallow((state) => ({
        isBreathingVisible: state.isBreathingVisible,
        isGreetingsVisible: state.isGreetingsVisible,
        isTimerVisible: state.isTimerVisible,
      })),
    );
  const { t } = useTranslation();

  return (
    <main
      className="flex flex-1 flex-col items-center justify-center"
      aria-label={t("home.layout.main.aria")}
    >
      {(isGreetingsVisible || isTimerVisible) && <GreetingsContent />}
      {isBreathingVisible && <BreathingContent />}
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
            <WebTimer />
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

export default Home;
