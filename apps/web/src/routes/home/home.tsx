import { useTranslation } from "react-i18next";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useDockStore } from "@/stores/dock.store";

import { AppSidebar } from "./components/app-sidebar";
import {
  Background,
  BackgroundOverlay,
} from "./components/backgrounds/backgrounds";
import { BackgroundSelectorSheet } from "./components/backgrounds/components/background-selector.sheet";
import { BreathePod } from "./components/breathing-pod/breathing-pod";
// import { Clock } from "./components/clock/clock";
import { Dock } from "./components/dock/dock";
import { Greeting } from "./components/greetings/greetings-mantras";
import { AppLayout } from "./components/layout";
import { Quote } from "./components/quote/quote";
import { SoundscapesSheet } from "./components/soundscapes/soundscapes.sheet";
import { Timer } from "./components/timer/timer";
import { TodoListSheet } from "./components/todo-list/components/todo-list.sheet";

export const Home = () => {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <Background />
        <BackgroundOverlay />
        <AppLayout>
          <TopBar />
          <Content />
          <BottomBar />
        </AppLayout>
      </SidebarInset>
    </SidebarProvider>
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
      {/* <div className="flex h-6 w-full justify-center bg-black/5 backdrop-blur-md">
        <Clock />
      </div> */}

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
