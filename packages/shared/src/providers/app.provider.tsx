import { PropsWithChildren } from "react";
import { QueryProvider } from "./query-client.provider";
import { I18nextProvider } from "react-i18next";
import { i18n } from "../i18n";

interface AppProviderProps extends PropsWithChildren {
  platform: "web" | "extension";
}

export const AppProvider = ({ children, platform }: AppProviderProps) => {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryProvider>{children}</QueryProvider>
    </I18nextProvider>
  );
};
