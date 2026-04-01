import { useTranslation } from "@repo/shared/i18n";
import {
  AppLayout,
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
  SoundscapesSheet,
  TabStashSheet,
  TaskListSheet,
  useDockStore,
} from "@repo/shared";
import { AnimatePresence, motion } from "framer-motion";
import { WebSiteBlockerSheet } from "@/components/web.site-blocker.sheet";
import { WebTimer } from "@/components/web.timer";
import { useShallow } from "zustand/shallow";

const Home = () => {
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
      <WebSiteBlockerSheet />
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
