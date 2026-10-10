"use client";

import {
  MantineProvider,
  isMantineColorScheme,
  type MantineColorScheme,
  type MantineColorSchemeManager,
} from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { LanguageProvider } from "../context/LanguageContext";
import { theme } from "../theme";

const colorSchemeStorageKey = "mantine-color-scheme-value";

const sessionStorageColorSchemeManager: MantineColorSchemeManager = {
  get(defaultValue: MantineColorScheme) {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    const value = window.sessionStorage.getItem(colorSchemeStorageKey);

    return isMantineColorScheme(value) ? value : defaultValue;
  },
  set(value: MantineColorScheme) {
    window.sessionStorage.setItem(colorSchemeStorageKey, value);
  },
  subscribe() {},
  unsubscribe() {},
  clear() {
    window.sessionStorage.removeItem(colorSchemeStorageKey);
  },
};

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        theme={theme}
        defaultColorScheme="dark"
        colorSchemeManager={sessionStorageColorSchemeManager}
      >
        <LanguageProvider>{children}</LanguageProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}
