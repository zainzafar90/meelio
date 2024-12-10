import { useTranslation } from "react-i18next";

import { Clock, useDockStore } from "@repo/shared";

import { Background } from "@repo/shared";
import { BackgroundOverlay } from "@repo/shared";
import { BackgroundSelectorSheet } from "@repo/shared";
import { BreathePod } from "@repo/shared";
import { Greeting } from "@repo/shared";
import { AppLayout } from "@repo/shared";
import { Quote } from "@repo/shared";
import { SoundscapesSheet } from "@repo/shared";
import { Timer } from "@repo/shared";
import { TodoListSheet } from "@repo/shared";
import { Dock } from "@repo/shared";

const Home = () => {
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
    </main>
  );
};

const GreetingsContent = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <Greeting />
      <Quote />
    </div>
  );
};

const BreathingContent = () => {
  return <BreathePod />;
};

const TopBar = () => {
  const isTimerVisible = useDockStore((state) => {
    return state.isTimerVisible;
  });

  return (
    <div className="relative">
              <div className="flex h-6 w-full justify-center bg-black/5 backdrop-blur-md">
                <Clock />
              </div>

      {isTimerVisible && <Timer />}
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
