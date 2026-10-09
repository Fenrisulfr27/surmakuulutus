import type { Metadata } from "next";
import HomePage from "../views/HomePage";

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

  return <HomePage initialPage={initialPage} />;
}
