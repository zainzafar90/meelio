import { useEffect, useState } from "react";

interface DebouncedValueOptions {
  delay: number;
}

export function useDebouncedValue<T>(
  value: T,
  options: DebouncedValueOptions
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, options.delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, options.delay]);

  return debouncedValue;
}