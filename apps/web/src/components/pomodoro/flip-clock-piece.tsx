import React, { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { usePrevious } from "@/hooks/use-previous";

interface FlipClockPieceProps {
  interval: number | string | null;
}

export const FlipClockPiece: React.FC<FlipClockPieceProps> = ({ interval }) => {
  const flipRef = useRef<HTMLSpanElement | null>(null);
  const prevCount = usePrevious(interval);

  useEffect(() => {
    if (flipRef.current) {
      flipRef.current.classList.remove("flip");
      void flipRef.current.offsetWidth;
      flipRef.current.classList.add("flip");
    }
  }, [interval]);

  return (
    <span className="my-0 mx-0 inline-block p-1 font-mono rounded-lg">
      <span ref={flipRef}>
        <b
          className={cn(
            "card relative text-6xl sm:text-9xl",
            "dark:text-[var(--flip-gradient-bottom)]text-[var(--flip-gradient-top)]",
            {
              "opacity-50": interval === null,
            }
          )}
        >
          <b className="card__top">{interval || "0"}</b>
          <b className="card__bottom" data-value={prevCount?.toString()} />
          <b className="card__back" data-value={prevCount?.toString()}>
            <b
              className="card__bottom"
              data-value={(interval || "0")?.toString()}
            />
          </b>
        </b>
      </span>
    </span>
  );
};
