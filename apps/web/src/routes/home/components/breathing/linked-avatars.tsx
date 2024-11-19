import { clsx } from "clsx";
import { motion } from "framer-motion";
import { CircleDashed } from "lucide-react";

const transition = {
  duration: 0.75,
  repeat: Infinity,
  repeatDelay: 1.25,
};

function Rings() {
  return (
    <svg
      fill="none"
      viewBox="0 0 500 500"
      className={clsx(
        "size-full w-[min(500px,50vw)]",
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
}

function Checkmark() {
  return (
    <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 transform items-center justify-center">
      <motion.div
        variants={{
          idle: { scale: 1 },
          active: {
            scale: [1, 1.15, 1],
            transition: { ...transition, duration: 0.75 },
          },
        }}
        className="flex size-6 items-center justify-center rounded-full bg-gradient-to-t from-zinc-300 to-zinc-100 shadow"
      >
        <CircleDashed className="size-4 text-zinc-400" />
      </motion.div>
    </div>
  );
}

export function LinkedAvatars() {
  return (
    <motion.div
      aria-hidden="true"
      className="isolate mx-auto h-full"
      initial="idle"
      whileHover="active"
      variants={{ idle: {}, active: {} }}
    >
      <Rings />
      <Checkmark />
    </motion.div>
  );
}
