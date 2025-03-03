import { PostHogProvider } from "posthog-js/react";
import { env } from "../utils/env.utils";
import { PostHogConfig } from "posthog-js";

type TelemetryProviderProps = {
  children: React.ReactNode;
};

export const TelemetryProvider = ({ children }: TelemetryProviderProps) => {
  const options: Partial<PostHogConfig> = {
    api_host: env.posthogHost,
    persistence: "localStorage",
    autocapture: true,
    debug: env.dev === false,
    loaded: (posthog: any) => {
      if (env.dev === false) {
        posthog.debug();
      }
    },
  };

  return (
    <PostHogProvider apiKey={env.posthogKey} options={options}>
      {children}
    </PostHogProvider>
  );
};
