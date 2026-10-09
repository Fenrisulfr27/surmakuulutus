"use client";

import type { Ad } from "../context/AdsContext";
import AdCard from "../components/AdCard";

interface AdDetailsPageProps {
  ad: Ad;
}

export default function AdDetailsPage({ ad }: AdDetailsPageProps) {
  return (
    <AdCard ad={ad} />
  );
}
