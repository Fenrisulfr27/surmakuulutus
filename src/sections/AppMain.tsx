import HomePage from "../views/HomePage";
import type { AdsPageData } from "../lib/ads";

export function AppMain() {
  const initialData: AdsPageData = {
    data: [] as never[],
    totalPages: 1,
    currentPage: 1,
    totalAds: 0,
  };

  return <HomePage initialPage={1} initialData={initialData} />;
}
