import { useEffect } from "react";
import { useShallow } from "zustand/shallow";
import { useTranslation } from "@repo/shared/i18n";

import {
  AppLayout,
  AppProvider,
  Background,
  BackgroundSelectorSheet,
  BookmarksDynamicIsland,
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
  useAppStore,
  useBookmarksStore,
  useDockStore,
} from "@repo/shared";
import { ExtensionSiteBlockerSheet } from "./components/extension.site-blocker.sheet";
import { ExtensionTimer } from "./components/extension.timer";
import { extensionTimerStore } from "./stores/extension.timer.store";

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
        <div className="hidden shrink-0 justify-center pb-5 [@media(min-height:580px)]:flex">
          <Quote />
        </div>
        <BottomBar />
      </AppLayout>
    </>
  );
}

const Content = () => {
  const { t } = useTranslation();
  const { isBreathingVisible } = useDockStore(
    useShallow((state) => ({
      isBreathingVisible: state.isBreathingVisible,
    }))
  );

  return (
    <main
      className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden"
      aria-label={t("home.layout.main.aria")}
    >
      {!isBreathingVisible && (
        <FocusDashboard
          timerStore={extensionTimerStore}
          timerPanel={<ExtensionTimer />}
        />
      )}
      {isBreathingVisible && <BreathePod />}
      <SoundscapesSheet />
      <TaskListSheet />
      <NotesSheet />
      <BackgroundSelectorSheet />
      <ExtensionSiteBlockerSheet />
      <TabStashSheet />
      <BookmarksSheet />
      <CalendarSheet />
      <ShortcutsModal />
    </main>
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
      className="flex shrink-0 items-center justify-center pb-2"
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
