"use client";

import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import {
  LanguageContext,
  translations,
  type Language,
  type TranslationKey,
} from "./language";

const languageChangeEvent = "languagechange";

function getSavedLanguage(): Language {
  if (typeof window === "undefined") {
    return "et";
  }

  const savedLanguage = window.localStorage.getItem("language");

  return savedLanguage === "en" ? "en" : "et";
}

function subscribeToLanguageChange(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(languageChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(languageChangeEvent, onStoreChange);
  };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(
    subscribeToLanguageChange,
    getSavedLanguage,
    () => "et",
  );

  const setLanguage = (nextLanguage: Language) => {
    window.localStorage.setItem("language", nextLanguage);
    document.documentElement.lang = nextLanguage;
    window.dispatchEvent(new Event(languageChangeEvent));
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey) => translations[key][language],
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
