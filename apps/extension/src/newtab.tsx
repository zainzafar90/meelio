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
  useAuthActionsStore,
  useBookmarksStore,
  useDockStore,
  useZenModeStore,
} from "@repo/shared";
import { createAuth } from "./auth/auth-client";
import { bearerStore } from "./auth/bearer-store";
import { startSignIn } from "./auth/extension-sign-in";
import { ExtensionSiteBlockerSheet } from "./components/extension.site-blocker.sheet";
import { ExtensionTimer } from "./components/extension.timer";
import { createExtensionZenModeRuntime } from "./features/zen-mode/extension-zen-mode.runtime";
import { extensionTimerStore } from "./stores/extension.timer.store";

import "./style.css";

const API_URL = import.meta.env.WXT_API_URL;
const WEB_URL = import.meta.env.WXT_WEB_URL;
if (!API_URL) throw new Error("WXT_API_URL is required (see apps/extension/.env.development)");
if (!WEB_URL) throw new Error("WXT_WEB_URL is required (see apps/extension/.env.development)");

const { signOut: extensionSignOut } = createAuth(API_URL);

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

  const { isTimerVisible, isBreathingVisible } = useDockStore(
    useShallow((state) => ({
      isTimerVisible: state.isTimerVisible,
      isBreathingVisible: state.isBreathingVisible,
    }))
  );
  const { zenPhase } = useZenModeStore(
    useShallow((state) => ({
      zenPhase: state.phase,
    }))
  );
  const { isRunning } = extensionTimerStore(
    useShallow((state) => ({
      isRunning: state.isRunning,
    }))
  );

  return (
    <>
      <Background />
      <AppLayout>
        <TopBar />
        <Content />
        {!(isTimerVisible || isRunning || isBreathingVisible || zenPhase !== "inactive") && (
          <div className="hidden shrink-0 justify-center pb-4 [@media(min-height:580px)]:flex">
            <Quote />
          </div>
        )}
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
      <Dock timerStore={extensionTimerStore} />
    </footer>
  );
}

export const NewTab = () => {
  useAppStore.getState().setPlatform("extension");

  useEffect(() => {
    useZenModeStore.getState().setRuntime(createExtensionZenModeRuntime());
    void useZenModeStore.getState().refreshBrowserCapabilities();

    const store = useAuthActionsStore.getState();
    store.setActions({
      signIn: () => startSignIn(WEB_URL),
      signOut: async () => {
        await extensionSignOut();
        useAuthActionsStore.getState().setIsSignedIn(false);
      },
    });

    const refreshSignedIn = () => {
      void bearerStore.getToken().then((t) => {
        useAuthActionsStore.getState().setIsSignedIn(t !== null);
      });
    };
    refreshSignedIn();

    const onMessage = (msg: { type?: string }) => {
      if (msg?.type === "MEELIO_AUTH_STATE_CHANGED") refreshSignedIn();
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  return (
    <AppProvider>
      <Home />
    </AppProvider>
  );
}

export default NewTab;
