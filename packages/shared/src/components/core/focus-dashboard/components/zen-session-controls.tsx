import { useEffect, useRef, useState } from "react";
import { Brain, Settings2 } from "lucide-react";

import { cn } from "../../../../lib";
import {
  ZenModeStatusSummary,
  type ZenModeStatusItem,
} from "./zen-mode-status-row";

interface ZenSessionControlsProps {
  windowFocused: boolean;
  summaryItems: ZenModeStatusItem[];
  endZenLabel: string;
  configureLabel: string;
  onEndZen: () => void;
  onConfigure: () => void;
}

type ControlsInteractionState = {
  isHovered: boolean;
  isFocusWithin: boolean;
  isMouseActive: boolean;
};

const INITIAL_INTERACTION_STATE: ControlsInteractionState = {
  isHovered: false,
  isFocusWithin: false,
  isMouseActive: false,
};

export const ZenSessionControls = ({
  windowFocused,
  summaryItems,
  endZenLabel,
  configureLabel,
  onEndZen,
  onConfigure,
}: ZenSessionControlsProps) => {
  const [interactionState, setInteractionState] = useState(
    INITIAL_INTERACTION_STATE,
  );
  const mouseActiveTimeoutRef = useRef<ReturnType<typeof window.setTimeout>>(null);
  const shouldReveal =
    interactionState.isMouseActive ||
    interactionState.isHovered ||
    interactionState.isFocusWithin;

  useEffect(() => {
    if (windowFocused) {
      return;
    }

    setInteractionState(INITIAL_INTERACTION_STATE);
  }, [windowFocused]);

  useEffect(() => {
    const markMouseActive = () => {
      setInteractionState((current) => ({
        ...current,
        isMouseActive: true,
      }));

      if (mouseActiveTimeoutRef.current) {
        window.clearTimeout(mouseActiveTimeoutRef.current);
      }

      mouseActiveTimeoutRef.current = window.setTimeout(() => {
        setInteractionState((current) => ({
          ...current,
          isMouseActive: false,
        }));
        mouseActiveTimeoutRef.current = null;
      }, 3000);
    };

    window.addEventListener("mousemove", markMouseActive, { passive: true });

    return () => {
      window.removeEventListener("mousemove", markMouseActive);
      if (mouseActiveTimeoutRef.current) {
        window.clearTimeout(mouseActiveTimeoutRef.current);
        mouseActiveTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center px-4 transition-opacity duration-1000 sm:bottom-28",
        {
          "opacity-100": shouldReveal,
          "opacity-25": !shouldReveal,
        },
      )}
    >
      <div
        className="pointer-events-auto flex flex-col items-center gap-2"
        onMouseEnter={() =>
          setInteractionState((current) => ({ ...current, isHovered: true }))
        }
        onMouseLeave={() =>
          setInteractionState((current) => ({ ...current, isHovered: false }))
        }
        onFocusCapture={() =>
          setInteractionState((current) => ({ ...current, isFocusWithin: true }))
        }
        onBlurCapture={(event) => {
          const nextTarget = event.relatedTarget;
          if (
            nextTarget instanceof Node &&
            event.currentTarget.contains(nextTarget)
          ) {
            return;
          }

          setInteractionState((current) => ({
            ...current,
            isFocusWithin: false,
          }));
        }}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-full transition-[background-color] duration-300 ease-out",
            shouldReveal ? "bg-white/[0.08]" : "bg-white/[0.03]",
          )}
        >
          <div className="pointer-events-none absolute inset-0 rounded-full bg-white/20" />
          <div
            className={cn(
              "relative flex items-center gap-3 px-2 py-1.5 transition-opacity duration-300 ease-out",
              shouldReveal ? "opacity-100" : "opacity-55",
            )}
          >
            <button
              type="button"
              onClick={onConfigure}
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-full backdrop-blur-xl transition-[background-color,color] duration-300 ease-out",
                shouldReveal
                  ? "bg-white/[0.88] text-zinc-950"
                  : "bg-white/[0.54] text-zinc-950/70",
              )}
              aria-label={configureLabel}
            >
              <Settings2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={onEndZen}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium backdrop-blur-xl transition-[background-color,color] duration-300 ease-out",
                shouldReveal
                  ? "bg-white/[0.88] text-zinc-950"
                  : "bg-white/[0.54] text-zinc-950/70",
              )}
            >
              <Brain className="size-3.5" />
              <span>{endZenLabel}</span>
            </button>
          </div>
        </div>
        <ZenModeStatusSummary
          items={summaryItems}
          className={cn(
            "transition-colors duration-300 ease-out",
            shouldReveal ? "text-white/82" : "text-white/50",
          )}
        />
      </div>
    </div>
  );
};
