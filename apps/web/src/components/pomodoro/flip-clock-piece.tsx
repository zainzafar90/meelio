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
      // removes class from clock piece
      flipRef.current.classList.remove("flip");

      // accessing a readonly property (making insignificantly smaller call) - adds delay when flip is finished and retriggered
      void flipRef.current.offsetWidth;

      // adds class from clock piece
      flipRef.current.classList.add("flip");
    }
  }, [interval]);

  return (
    <span className="my-0 mx-0 inline-block p-1 font-mono shadow-sm shadow-gray-800/90 rounded-lg">
      <span ref={flipRef}>
        <b
          className={cn("card relative text-6xl text-white sm:text-9xl", {
            "text-gray-500": interval === null,
          })}
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
