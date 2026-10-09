import { createContext, useContext, useState, type ReactNode } from "react";
import type { Ad } from "../lib/ads";

export type { Ad } from "../lib/ads";

type AdsContextType = {
  ads: Ad[];
  addAd: (ad: Ad) => void;
};

const AdsContext = createContext<AdsContextType | null>(null);

export function AdsProvider({ children }: { children: ReactNode }) {
  const [ads, setAds] = useState<Ad[]>([]);

  const addAd = (ad: Ad) => {
    setAds((prev) => [...prev, ad]);
  };

  return (
    <AdsContext.Provider value={{ ads, addAd }}>{children}</AdsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAds() {
  const context = useContext(AdsContext);
  if (!context) throw new Error("useAds must be used inside AdsProvider");
  return context;
}
