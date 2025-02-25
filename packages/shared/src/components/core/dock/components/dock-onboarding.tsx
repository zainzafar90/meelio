import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@repo/ui/components/ui/button";
import { useOnboardingStore } from "../../../../stores/onboarding.store";
import { Icons } from "../../../../components/icons/icons";
import { cn } from "@repo/ui/lib/utils";
import { Logo } from "../../../../components/common/logo";
import { useDockStore } from "../../../../stores/dock.store";

const ONBOARDING_STEPS = [
  {
    id: "welcome",
    titleKey: "onboarding.welcome.title",
    descriptionKey: "onboarding.welcome.description",
    icon: Logo,
    gradient: "from-blue-500/20 to-purple-500/20",
    iconClass: "text-blue-400",
    action: null,
  },
  {
    id: "timer",
    titleKey: "onboarding.timer.title",
    descriptionKey: "onboarding.timer.description",
    icon: Icons.worldClockActive,
    gradient: "from-red-500/20 to-orange-500/20",
    iconClass: "text-red-400",
    action: "toggleTimer",
  },
  {
    id: "soundscapes",
    titleKey: "onboarding.soundscapes.title",
    descriptionKey: "onboarding.soundscapes.description",
    icon: Icons.soundscapesActive,
    gradient: "from-green-500/20 to-emerald-500/20",
    iconClass: "text-green-400",
    action: null,
  },
  {
    id: "breathing",
    titleKey: "onboarding.breathing.title",
    descriptionKey: "onboarding.breathing.description",
    icon: Icons.breathingActive,
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconClass: "text-blue-400",
    action: "toggleBreathing",
  },
  {
    id: "todos",
    titleKey: "onboarding.todos.title",
    descriptionKey: "onboarding.todos.description",
    icon: Icons.todoListActive,
    gradient: "from-yellow-500/20 to-amber-500/20",
    iconClass: "text-yellow-400",
    action: null,
  },
  {
    id: "site-blocker",
    titleKey: "onboarding.site-blocker.title",
    descriptionKey: "onboarding.site-blocker.description",
    icon: Icons.siteBlockerActive,
    gradient: "from-purple-500/20 to-pink-500/20",
    iconClass: "text-purple-400",
    action: null,
  },
  {
    id: "tab-stash",
    titleKey: "onboarding.tab-stash.title",
    descriptionKey: "onboarding.tab-stash.description",
    icon: Icons.tabStashActive,
    gradient: "from-indigo-500/20 to-violet-500/20",
    iconClass: "text-indigo-400",
    action: null,
  },
  {
    id: "background",
    titleKey: "onboarding.background.title",
    descriptionKey: "onboarding.background.description",
    icon: Icons.background,
    gradient: "from-teal-500/20 to-emerald-500/20",
    iconClass: "text-teal-400",
    action: null,
  },
  {
    id: "settings",
    titleKey: "onboarding.settings.title",
    descriptionKey: "onboarding.settings.description",
    icon: Icons.settings,
    gradient: "from-gray-500/20 to-zinc-500/20",
    iconClass: "text-gray-400",
    action: null,
  },
];

export const DockOnboarding = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const { hasDockOnboardingCompleted, setDockOnboardingCompleted } =
    useOnboardingStore();
  const {
    toggleTimer,
    toggleSoundscapes,
    toggleBreathing,
    toggleTodos,
    toggleSiteBlocker,
    toggleBackgrounds,
    toggleTabStash,
  } = useDockStore();

  const handleNext = useCallback(() => {
    if (currentStep === ONBOARDING_STEPS.length - 1) {
      setDockOnboardingCompleted();
    } else {
      // Reset previous feature if it was toggled
      const currentAction = ONBOARDING_STEPS[currentStep].action;
      if (currentAction) {
        const actionFn = {
          toggleTimer,
          toggleBreathing,
        }[currentAction];
        actionFn?.();
      }

      setCurrentStep((prev) => prev + 1);

      const nextAction = ONBOARDING_STEPS[currentStep + 1]?.action;
      if (nextAction) {
        const actionFn = {
          toggleTimer,
          toggleBreathing,
        }[nextAction];
        actionFn?.();
      }
    }
  }, [currentStep, setDockOnboardingCompleted, toggleTimer, toggleBreathing]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      const currentAction = ONBOARDING_STEPS[currentStep].action;
      if (currentAction) {
        const actionFn = {
          toggleTimer,
          toggleSoundscapes,
          toggleBreathing,
          toggleTodos,
          toggleSiteBlocker,
          toggleBackgrounds,
          toggleTabStash,
        }[currentAction];
        actionFn?.();
      }

      setCurrentStep((prev) => prev - 1);

      const prevAction = ONBOARDING_STEPS[currentStep - 1]?.action;
      if (prevAction) {
        const actionFn = {
          toggleTimer,
          toggleSoundscapes,
          toggleBreathing,
          toggleTodos,
          toggleSiteBlocker,
          toggleBackgrounds,
          toggleTabStash,
        }[prevAction];
        actionFn?.();
      }
    }
  }, [
    currentStep,
    toggleTimer,
    toggleSoundscapes,
    toggleBreathing,
    toggleTodos,
    toggleSiteBlocker,
    toggleBackgrounds,
    toggleTabStash,
  ]);

  const handleSkip = () => {
    // Reset any active features
    const currentAction = ONBOARDING_STEPS[currentStep].action;
    if (currentAction) {
      const actionFn = {
        toggleTimer,
        toggleSoundscapes,
        toggleBreathing,
        toggleTodos,
        toggleSiteBlocker,
        toggleBackgrounds,
        toggleTabStash,
      }[currentAction];
      actionFn?.();
    }
    setDockOnboardingCompleted();
  };

  useEffect(() => {
    if (hasDockOnboardingCompleted) return;

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
  }, [hasDockOnboardingCompleted, handleNext, handlePrevious]);

  if (hasDockOnboardingCompleted) return null;

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-24 inset-x-0 z-50 mx-auto w-[340px]"
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
      >
        <motion.div
          className={cn(
            "relative flex flex-col gap-4 w-[340px] rounded-xl border border-white/10",
            "bg-gradient-to-br p-4 shadow-2xl backdrop-blur-xl",
            "bg-zinc-900/90",
            currentStepData.gradient
          )}
          initial={false}
          animate={{
            backgroundColor: ["rgba(24, 24, 27, 0.9)", "rgba(24, 24, 27, 0.9)"],
          }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <motion.div
              className={cn(
                "flex items-center justify-center size-24 rounded-full",
                "bg-zinc-900/90 border border-white/10 shadow-2xl",
                "backdrop-blur-xl"
              )}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <IconComponent
                className={cn("size-12", currentStepData.iconClass)}
              />
            </motion.div>
          </div>

          <div className="space-y-4 pt-12">
            <motion.h3
              id="onboarding-title"
              className="text-center text-xl font-medium text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {t(currentStepData.titleKey)}
            </motion.h3>
            <motion.p
              id="onboarding-description"
              className="text-center text-sm text-white/70 line-clamp-2 h-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {t(currentStepData.descriptionKey)}
            </motion.p>
          </div>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex justify-center gap-1">
              {ONBOARDING_STEPS.map((_, index) => (
                <motion.div
                  key={index}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    index === currentStep ? "w-8 bg-white" : "w-4 bg-white/20"
                  )}
                  role="progressbar"
                  aria-valuenow={index + 1}
                  aria-valuemin={1}
                  aria-valuemax={ONBOARDING_STEPS.length}
                  aria-label={`Step ${index + 1} of ${ONBOARDING_STEPS.length}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleSkip}
                aria-label={t("common.actions.skip")}
              >
                {t("common.actions.skip")}
              </Button>
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                    aria-label={t("common.actions.previous")}
                  >
                    {t("common.actions.previous")}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="bg-white/80 hover:bg-white/90"
                  aria-label={
                    currentStep === ONBOARDING_STEPS.length - 1
                      ? t("common.actions.finish")
                      : t("common.actions.next")
                  }
                >
                  {currentStep === ONBOARDING_STEPS.length - 1
                    ? t("common.actions.finish")
                    : t("common.actions.next")}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
