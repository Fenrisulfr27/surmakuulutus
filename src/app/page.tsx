import type { Metadata } from "next";
import HomePage from "../views/HomePage";
import { listAds } from "../lib/ads";

export const metadata: Metadata = {
  title: "Surmakuulutused – Avaleht",
};

interface PageProps {
  searchParams?: Promise<{
    page?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const initialPage = Number(params.page) || 1;
  const initialData = await listAds(initialPage, 12);

  return <HomePage initialPage={initialPage} initialData={initialData} />;
}
