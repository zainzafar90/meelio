import { useEffect, useId, useRef } from "react";

import { animate, timeline } from "motion";

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
  const groupRef = useRef<SVGGElement>(null);
  const ref = useRef<SVGCircleElement>(null);
  const blurId = useId();

  useEffect(() => {
    const delay = Math.random() * 2;

    const animations = [
      animate(groupRef.current!, { opacity: 1 }, { duration: 4, delay }),
      animate(
        ref.current!,
        {
          opacity: dim ? [0.2, 0.5] : [1, 0.6],
          scale: dim ? [1, 1.2] : [1.2, 1],
        },
        {
          delay,
          duration: Math.random() * 2 + 2,
          direction: "alternate",
          repeat: Infinity,
        }
      ),
    ];

    return () => {
      for (const animation of animations) {
        animation.cancel();
      }
    };
  }, [dim]);

  return (
    <g ref={groupRef} className="opacity-0">
      <circle
        ref={ref}
        cx={cx}
        cy={cy}
        r={1}
        style={{
          transformOrigin: `${cx / 16}rem ${cy / 16}rem`,
          opacity: dim ? 0.2 : 1,
          transform: `scale(${dim ? 1 : 1.2})`,
        }}
        filter={blur ? `url(#${blurId})` : undefined}
      />
    </g>
  );
}

interface ConstellationProps {
  points: [number, number][];
}

function Constellation({ points }: ConstellationProps) {
  const ref = useRef();
  const uniquePoints = points.filter(
    (point, pointIndex) =>
      points.findIndex((p) => String(p) === String(point)) === pointIndex
  );
  const isFilled = uniquePoints.length !== points.length;

  useEffect(() => {
    if (!ref.current) return;

    const sequence = timeline([
      [
        ref.current,
        { strokeDashoffset: 0, visibility: "visible" },
        { duration: 5, delay: Math.random() * 3 + 2 },
      ],
      [ref.current, { fill: "rgb(255 255 255 / 0.02)" }, { duration: 1 }],
    ]);

    return () => {
      sequence.cancel();
    };
  }, [isFilled]);

  return (
    <>
      <path
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={ref as any}
        stroke="white"
        strokeOpacity="0.2"
        strokeDasharray={1}
        strokeDashoffset={1}
        pathLength={1}
        fill="transparent"
        d={`M ${points.join("L")}`}
        className="invisible"
      />
      {uniquePoints.map((point, pointIndex) => (
        <Star key={pointIndex} point={point} />
      ))}
    </>
  );
}

export function StarField() {
  const blurId = useRef<string>("");

  useEffect(() => {
    blurId.current = Math.random().toString(36).substr(2, 9);
  }, []);

  return (
    <svg
      viewBox="0 0 881 211"
      fill="white"
      aria-hidden="true"
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
