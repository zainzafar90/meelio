import { useTranslation } from "@repo/shared/i18n";
import {
  AppLayout,
  Background,
  BackgroundSelectorSheet,
  BookmarksSheet,
  BreathePod,
  CalendarDynamicIsland,
  CalendarSheet,
  Dock,
  FocusDashboard,
  Quote,
  NotesSheet,
  SearchPopover,
  ShortcutsModal,
  SoundscapesSheet,
  TabStashSheet,
  TaskListSheet,
  useDockStore,
} from "@repo/shared";
import { WebSiteBlockerSheet } from "@/components/web.site-blocker.sheet";
import { WebTimer } from "@/components/web.timer";
import { webTimerStore } from "@/stores/web.timer.store";
import { useShallow } from "zustand/shallow";

const Home = () => {
  return (
    <>
      <Background />
      <AppLayout>
        <TopBar />
        <Content />
        <div className="flex shrink-0 justify-center pb-5">
          <Quote />
        </div>
        <BottomBar />
      </AppLayout>
    </>
  );
};

const Content = () => {
  const { isBreathingVisible } =
    useDockStore(
      useShallow((state) => ({
        isBreathingVisible: state.isBreathingVisible,
      })),
    );
  const { t } = useTranslation();

  return (
    <main
      className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden"
      aria-label={t("home.layout.main.aria")}
    >
      {!isBreathingVisible && (
        <FocusDashboard
          timerStore={webTimerStore}
          timerPanel={<WebTimer />}
        />
      )}
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
      className="flex shrink-0 items-center justify-center pb-2"
      aria-label={t("home.layout.footer.aria")}
    >
      <Dock />
    </footer>
  );
};

export default Home;
