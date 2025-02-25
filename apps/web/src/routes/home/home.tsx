import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { Clock, TabStashSheet, useDockStore, useAuthStore } from "@repo/shared";
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
import { AuthContainer } from "@repo/shared";
import { PageSkeleton } from "@repo/shared";
import { api } from "@repo/shared";
import { AnimatePresence, motion } from "framer-motion";
import { WebTimer } from "@/components/web-timer";
import { SiteBlockerSheet } from "@repo/shared";
import { toast } from "sonner";

const Home = () => {
  const { user, loading, authenticate } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);

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
        toast.success("Successfully verified!", {
          description: "Welcome back to Meelio.",
        });
        searchParams.delete("token");
        window.history.replaceState({}, "", window.location.pathname);
      } catch (e) {
        toast.error("Verification failed", {
          description: "Your link should be valid for 10 minutes. Please try again.",
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
        <BackgroundOverlay />
        <PageSkeleton>
          <h3 className="text-foreground font-medium">
            {isVerifying ? "Verifying your account..." : "Loading..."}
          </h3>
        </PageSkeleton>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Background />
        <BackgroundOverlay />
        <AuthContainer />
      </>
    );
  }

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
