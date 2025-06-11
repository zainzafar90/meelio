import { useCallback } from "react";

export function useConfetti() {
  return useCallback(async () => {
    const confetti = (await import("canvas-confetti")).default;
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);
}
