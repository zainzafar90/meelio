import { useId, useRef } from "react";

import { motion, Variants } from "framer-motion";

interface StarProps {
  point: [number, number, boolean?, boolean?];
}

const stars: [number, number, boolean?, boolean?][] = [
  // [cx, cy, dim, blur]
  [4, 4, true, true],
  [4, 44, true],
  [36, 22],
  [50, 146, true, true],
  [64, 43, true, true],
  [76, 30, true],
  [101, 116],
  [140, 36, true],
  [149, 134],
  [162, 74, true],
  [171, 96, true, true],
  [210, 56, true, true],
  [235, 90],
  [275, 82, true, true],
  [306, 6],
  [307, 64, true, true],
  [380, 68, true],
  [380, 108, true, true],
  [391, 148, true, true],
  [405, 18, true],
  [412, 86, true, true],
  [426, 210, true, true],
  [427, 56, true, true],
  [538, 138],
  [563, 88, true, true],
  [611, 154, true, true],
  [637, 150],
  [651, 146, true],
  [682, 70, true, true],
  [683, 128],
  [781, 82, true, true],
  [785, 158, true],
  [832, 146, true, true],
  [852, 89],
];

const constellations: [number, number][][] = [
  [
    [247, 103],
    [261, 86],
    [307, 104],
    [357, 36],
  ],
  [
    [586, 120],
    [516, 100],
    [491, 62],
    [440, 107],
    [477, 180],
    [516, 100],
  ],
  [
    [733, 100],
    [803, 120],
    [879, 113],
    [823, 164],
    [803, 120],
  ],
];

function Star({ point: [cx, cy, dim, blur] }: StarProps) {
  const blurId = useId();
  const delay = Math.random() * 2;

  const fadeInVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 4,
        delay,
      },
    },
  };

  const starVariants: Variants = {
    dim: {
      opacity: [0.2, 0.5],
      scale: [1, 1.2],
      transition: {
        duration: Math.random() * 2 + 2,
        repeat: Infinity,
        repeatType: "reverse",
      },
    },
    bright: {
      opacity: [1, 0.6],
      scale: [1.2, 1],
      transition: {
        duration: Math.random() * 2 + 2,
        repeat: Infinity,
        repeatType: "reverse",
      },
    },
  };

  return (
    <motion.g initial="hidden" animate="visible" variants={fadeInVariants}>
      <motion.circle
        cx={cx}
        cy={cy}
        r={1}
        style={{
          transformOrigin: `${cx / 16}rem ${cy / 16}rem`,
        }}
        initial={dim ? "dim" : "bright"}
        animate={dim ? "dim" : "bright"}
        variants={starVariants}
        filter={blur ? `url(#${blurId})` : undefined}
      />
    </motion.g>
  );
}

interface ConstellationProps {
  points: [number, number][];
}

function Constellation({ points }: ConstellationProps) {
  const uniquePoints = points.filter(
    (point, pointIndex) =>
      points.findIndex((p) => String(p) === String(point)) === pointIndex
  );
  const isFilled = uniquePoints.length !== points.length;

  const pathVariants: Variants = {
    hidden: {
      strokeDashoffset: 1,
      visibility: "hidden",
      fill: "transparent",
    },
    visible: {
      strokeDashoffset: 0,
      visibility: "visible",
      fill: isFilled ? "rgb(255 255 255 / 0.02)" : "transparent",
      transition: {
        strokeDashoffset: {
          duration: 5,
          delay: Math.random() * 3 + 2,
        },
        fill: {
          delay: 7,
          duration: 1,
        },
      },
    },
  };

  return (
    <>
      <motion.path
        stroke="white"
        strokeOpacity="0.2"
        strokeDasharray={1}
        pathLength={1}
        d={`M ${points.join("L")}`}
        initial="hidden"
        animate="visible"
        variants={pathVariants}
      />
      {uniquePoints.map((point, pointIndex) => (
        <Star key={pointIndex} point={point} />
      ))}
    </>
  );
}

export function StarField() {
  const blurId = useRef(Math.random().toString(36).substr(2, 9));

  return (
    <svg
      viewBox="0 0 881 211"
      fill="white"
      className="pointer-events-none absolute -right-44 top-14 w-[55.0625rem] origin-top-right rotate-[30deg] overflow-visible opacity-70"
    >
      <defs>
        <filter id={blurId.current}>
          <feGaussianBlur in="SourceGraphic" stdDeviation=".5" />
        </filter>
      </defs>
      {constellations.map((points, constellationIndex) => (
        <Constellation key={constellationIndex} points={points} />
      ))}
      {stars.map((point, pointIndex) => (
        <Star key={pointIndex} point={point} />
      ))}
    </svg>
  );
}
