import { clsx } from "clsx";
import { motion } from "framer-motion";

const transition = {
  duration: 0.75,
  repeat: Infinity,
  repeatDelay: 1.25,
};

export const BreathingRings = () => {
  return (
    <svg
      fill="none"
      viewBox="0 0 500 500"
      className={clsx(
        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        "size-full h-[min(500px,50vw)] w-[min(500px,50vw)]",
        "[mask-composite:intersect] [mask-image:linear-gradient(to_bottom,black_90%,transparent),radial-gradient(circle,rgba(0,0,0,1)_0%,rgba(0,0,0,0)_100%)]"
      )}
    >
      {Array.from(Array(42).keys()).map((n) => (
        <motion.circle
          variants={{
            idle: {
              scale: 1,
              strokeOpacity: 0.15,
            },
            active: {
              scale: [1, 1.08, 1],
              strokeOpacity: [0.15, 0.5, 0.15],
              transition: { ...transition, delay: n * 0.05 },
            },
          }}
          key={n}
          cx="250"
          cy="250"
          r={n * 14 + 4}
          className="stroke-white"
        />
      ))}
    </svg>
  );
};
