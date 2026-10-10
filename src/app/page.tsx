import type { Metadata } from "next";
import HomePage from "../views/HomePage";
import { listAds, type AdsSortOrder } from "../lib/ads";

export const metadata: Metadata = {
  title: "Surmakuulutused ja mälestuskuulutused Eestis",
  description:
    "Otsi surmakuulutusi ja mälestuskuulutusi lahkunu nime järgi. Vaata leinakuulutusi Eestis või lisa uus surmakuulutus.",
  keywords: [
    "surmakuulutused",
    "surmakuulutus",
    "leinakuulutused",
    "mälestuskuulutused",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Surmakuulutused ja mälestuskuulutused Eestis",
    description:
      "Otsi surmakuulutusi ja mälestuskuulutusi lahkunu nime järgi või lisa uus surmakuulutus.",
    url: "/",
  },
};

interface PageProps {
  searchParams?: Promise<{
    page?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const initialPage = Number(params.page) || 1;
  const initialSearch = params.search ?? "";
  const initialSort: AdsSortOrder =
    params.sort === "oldest" ? "oldest" : "newest";
  const initialData = await listAds({
    page: initialPage,
    limit: 12,
    search: initialSearch,
    sort: initialSort,
  });

  return (
    <HomePage
      initialPage={initialData.currentPage}
      initialData={initialData}
      initialSearch={initialSearch}
      initialSort={initialSort}
    />
  );
}
