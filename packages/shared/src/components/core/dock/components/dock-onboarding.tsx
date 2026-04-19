import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Brain } from "lucide-react";
import { useOnboardingStore } from "../../../../stores/onboarding.store";
import { useAuthStore } from "../../../../stores/auth.store";
import { Icons } from "../../../../components/icons/icons";
import { cn } from "@repo/ui/lib/utils";
import { Logo } from "../../../../components/common/logo";
import { useDockStore } from "../../../../stores/dock.store";
import { useShallow } from "zustand/shallow";

export const ONBOARDING_STEPS = [
  {
    id: "welcome",
    titleKey: "onboarding.welcome.title",
    descriptionKey: "onboarding.welcome.description",
    icon: Logo,
    gradient: "from-blue-500/20 to-purple-500/20",
    iconClass: "text-blue-400",
    action: null,
    position: 0, // Home
  },
  {
    id: "timer",
    titleKey: "onboarding.timer.title",
    descriptionKey: "onboarding.timer.description",
    icon: Brain,
    gradient: "from-red-600/20 to-orange-500/20",
    iconClass: "text-white/70",
    action: "toggleTimer",
    position: 1, // Timer
  },
  {
    id: "soundscapes",
    titleKey: "onboarding.soundscapes.title",
    descriptionKey: "onboarding.soundscapes.description",
    icon: Icons.soundscapesActive,
    gradient: "from-green-500/20 to-emerald-500/20",
    iconClass: "text-green-400",
    action: null,
    position: 2, // Soundscapes
  },
  {
    id: "breathing",
    titleKey: "onboarding.breathing.title",
    descriptionKey: "onboarding.breathing.description",
    icon: Icons.breathingActive,
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconClass: "text-blue-400",
    action: "toggleBreathing",
    position: 3, // Breathing
  },
  {
    id: "tasks",
    titleKey: "onboarding.tasks.title",
    descriptionKey: "onboarding.tasks.description",
    icon: Icons.taskListActive,
    gradient: "from-indigo-500/20 to-violet-500/20",
    iconClass: "text-indigo-400",
    action: null,
    position: 4, // Tasks
  },
  {
    id: "notes",
    titleKey: "onboarding.notes.title",
    descriptionKey: "onboarding.notes.description",
    icon: Icons.noteActive,
    gradient: "from-amber-500/20 to-orange-500/20",
    iconClass: "text-amber-400",
    action: null,
    position: 5, // Notes
  },
  {
    id: "site-blocker",
    titleKey: "onboarding.site-blocker.title",
    descriptionKey: "onboarding.site-blocker.description",
    icon: Icons.siteBlockerActive,
    gradient: "from-purple-500/20 to-pink-500/20",
    iconClass: "text-purple-400",
    action: null,
    position: 6, // Site Blocker
  },
  {
    id: "tab-stash",
    titleKey: "onboarding.tab-stash.title",
    descriptionKey: "onboarding.tab-stash.description",
    icon: Icons.tabStashActive,
    gradient: "from-sky-500/20 to-cyan-500/20",
    iconClass: "text-sky-400",
    action: null,
    position: 7, // Tab Stash
  },
  {
    id: "background",
    titleKey: "onboarding.background.title",
    descriptionKey: "onboarding.background.description",
    icon: Icons.background,
    gradient: "from-emerald-500/20 to-lime-500/20",
    iconClass: "text-emerald-400",
    action: null,
    position: 8, // Background
  },
  {
    id: "settings",
    titleKey: "onboarding.settings.title",
    descriptionKey: "onboarding.settings.description",
    icon: Icons.settings,
    gradient: "from-slate-600/20 to-stone-400/20",
    iconClass: "text-slate-400",
    action: null,
    position: 9, // Settings
  },
];

export const DockOnboarding = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );
  const { hasDockOnboardingCompleted, setDockOnboardingCompleted } =
    useOnboardingStore(
      useShallow((state) => ({
        hasDockOnboardingCompleted: state.hasDockOnboardingCompleted,
        setDockOnboardingCompleted: state.setDockOnboardingCompleted,
      }))
    );
  const {
    toggleTimer,
    toggleSoundscapes,
    toggleBreathing,
    toggleTasks,
    toggleSiteBlocker,
    toggleBackgrounds,
    toggleTabStash,
    setCurrentOnboardingStep,
  } = useDockStore(
    useShallow((state) => ({
      toggleTimer: state.toggleTimer,
      toggleSoundscapes: state.toggleSoundscapes,
      toggleBreathing: state.toggleBreathing,
      toggleTasks: state.toggleTasks,
      toggleSiteBlocker: state.toggleSiteBlocker,
      toggleBackgrounds: state.toggleBackgrounds,
      toggleTabStash: state.toggleTabStash,
      setCurrentOnboardingStep: state.setCurrentOnboardingStep,
    }))
  );

  const shouldShowOnboarding =
    !hasDockOnboardingCompleted && !user?.settings?.onboardingCompleted;

  useEffect(() => {
    if (shouldShowOnboarding) {
      setCurrentOnboardingStep(currentStep);
    }
    return () => setCurrentOnboardingStep(-1); // Reset when unmounted
  }, [currentStep, setCurrentOnboardingStep, shouldShowOnboarding]);

  const handleNext = useCallback(async () => {
    if (currentStep === ONBOARDING_STEPS.length - 1) {
      setCurrentOnboardingStep(-1); // Reset highlight
      setDockOnboardingCompleted();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [
    currentStep,
    setDockOnboardingCompleted,
    setCurrentOnboardingStep,
  ]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(async () => {
    // Reset any active features
    const currentAction = ONBOARDING_STEPS[currentStep].action;
    if (currentAction) {
      const actionFn = {
        toggleTimer,
        toggleSoundscapes,
        toggleBreathing,
        toggleTasks,
        toggleSiteBlocker,
        toggleBackgrounds,
        toggleTabStash,
      }[currentAction];
      actionFn?.();
    }
    setCurrentOnboardingStep(-1); // Reset highlight
    setDockOnboardingCompleted();
  }, [
    currentStep,
    setDockOnboardingCompleted,
    setCurrentOnboardingStep,
    toggleTimer,
    toggleSoundscapes,
    toggleBreathing,
    toggleTasks,
    toggleSiteBlocker,
    toggleBackgrounds,
    toggleTabStash,
  ]);

  useEffect(() => {
    if (!shouldShowOnboarding) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowRight":
        case "Enter":
          handleNext();
          break;
        case "ArrowLeft":
          handlePrevious();
          break;
        case "Escape":
          handleSkip();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shouldShowOnboarding, handleNext, handlePrevious, handleSkip]);

  if (!shouldShowOnboarding) return null;

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <AnimatePresence>
      <div
        key="backdrop"
        className="fixed inset-x-0 top-0 bottom-0 z-40 bg-black/20 backdrop-blur-sm"
      />

      <motion.div
        key="onboarding-modal"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-24 inset-x-0 z-50 mx-auto w-[340px]"
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
        data-testid="onboarding-modal"
      >
        <motion.div
          className="relative flex flex-col gap-4 w-[340px] rounded-2xl border border-white/[0.08] bg-zinc-950/85 p-5 shadow-[0_24px_64px_rgba(0,0,0,0.6)] backdrop-blur-3xl"
        >
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <motion.div
              className="flex items-center justify-center size-20 rounded-full border border-white/10 bg-black/20 backdrop-blur-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <IconComponent className={cn("size-9", currentStepData.iconClass)} />
            </motion.div>
          </div>

          <div className="space-y-2 pt-10">
            <motion.h3
              id="onboarding-title"
              className="text-center text-lg font-semibold text-white"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              data-testid="onboarding-title"
            >
              {t(currentStepData.titleKey)}
            </motion.h3>
            <motion.p
              id="onboarding-description"
              className="text-center text-sm text-white/50 leading-relaxed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              data-testid="onboarding-description"
            >
              {t(currentStepData.descriptionKey)}
            </motion.p>
          </div>

          <div className="flex justify-center gap-1 py-1">
            {ONBOARDING_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "h-0.5 rounded-full transition-all duration-300",
                  index === currentStep ? "w-6 bg-white/70" : "w-3 bg-white/15"
                )}
                data-testid={`onboarding-step-${index}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="px-3 py-1.5 text-sm text-white/30 transition-colors hover:text-white/60"
              data-testid="onboarding-skip"
            >
              {t("common.actions.skip")}
            </button>
            <div className="flex items-center gap-1">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-3 py-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
                  data-testid="onboarding-previous"
                >
                  {t("common.actions.previous")}
                </button>
              )}
              <button
                onClick={handleNext}
                className="rounded-xl bg-white/90 px-4 py-1.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
                data-testid={currentStep === ONBOARDING_STEPS.length - 1 ? "onboarding-finish" : "onboarding-next"}
              >
                {currentStep === ONBOARDING_STEPS.length - 1 ? t("common.actions.finish") : t("common.actions.next")}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
