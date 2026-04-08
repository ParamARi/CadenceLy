"use client";

import { ThemeModeScript, ThemeProvider } from "flowbite-react";
import { AuthSessionProvider } from "./AuthSessionProvider";
import { customTheme } from "./flowbiteTheme";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeModeScript />
      <ThemeProvider theme={customTheme}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </ThemeProvider>
    </>
  );
}
