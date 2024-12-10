import { useEffect, useRef, useState } from "react";

/**
 * Performs a linear interpolation between two values.
 *
 * @param {number} v0 - The first value. This represents the starting point of the interpolation.
 * @param {number} v1 - The second value. This represents the end point of the interpolation.
 * @param {number} t - The interpolation factor. This represents the proportion of the way between the two values. For example, a value of 0.5 will give the midpoint between v0 and v1.
 *                     A value of 0 will return v0, and a value of 1 will return v1. Values outside this range will extrapolate along the line between v0 and v1.
 *
 * @return {number} - Returns the interpolated value. This will be a value on the line between v0 and v1, determined by the factor t.
 *
 * Linear interpolation (lerp) is a mathematical technique used to find a value between two points on a line or curve.
 * It is commonly used in computer graphics and game development to create smooth transitions and animations.
 */
const lerp = (v0: number, v1: number, t: number): number => {
  return v0 * (1 - t) + v1 * t;
};

export const useOscillation = (
  initialVolume: number,
  isOscillating: boolean
) => {
  const [frequency] = useState(Math.random() * 1.5 + 0.5);
  const [phase] = useState(Math.random() * 2 * Math.PI);
  const [targetVolume, setTargetVolume] = useState(initialVolume);
  const time = useRef(0);

  useEffect(() => {
    const animationFrameId = requestAnimationFrame(function oscillate() {
      if (isOscillating) {
        time.current += 0.01;
        const volume =
          (Math.sin(2 * Math.PI * frequency * time.current + phase) + 1) / 2;
        setTargetVolume(volume);
      }
      requestAnimationFrame(oscillate);
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, [isOscillating, frequency, phase]);

  return { targetVolume, lerpValue: lerp };
};
