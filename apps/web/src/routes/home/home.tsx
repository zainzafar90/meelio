import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  Clock,
  TabStashSheet,
  BookmarksSheet,
  CalendarSheet,
  CalendarDynamicIsland,
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
import { NotesSheet } from "@repo/shared";
import { AuthContainer } from "@repo/shared";
import { PageSkeleton } from "@repo/shared";
import { api } from "@repo/shared";
import { AnimatePresence, motion } from "framer-motion";
import { WebTimer } from "@/components/web.timer";
import { SiteBlockerSheet } from "@repo/shared";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";

const Home = () => {
  const { user, guestUser, loading, authenticate } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      guestUser: state.guestUser,
      loading: state.loading,
      authenticate: state.authenticate,
      authenticateGuest: state.authenticateGuest,
      logout: state.logout,
    })),
  );
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");
      if (!token) return;

      setIsVerifying(true);
      try {
        const { data: user } = await api.auth.verifyMagicLink({
          token,
        });
        authenticate(user);
        toast.success(t("auth.verify.success.title"), {
          description: t("auth.verify.success.description"),
        });
        searchParams.delete("token");
        window.history.replaceState({}, "", window.location.pathname);
      } catch (e) {
        toast.error(t("auth.verify.failed.title"), {
          description: t("auth.verify.failed.description"),
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [searchParams, authenticate]);

  if (loading || isVerifying) {
    return (
      <>
        <Background />

        <PageSkeleton>
          <h3 className="text-foreground font-medium">
            {isVerifying ? t("auth.verify.verifying") : t("common.loading")}
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
