import { useEffect } from "react";
import { useWeatherStore } from "../stores/weather.store";

export const useWeather = (): void => {
  const { initializeStore } = useWeatherStore();

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);
};
