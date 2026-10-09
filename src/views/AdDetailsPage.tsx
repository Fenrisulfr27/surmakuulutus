"use client";

import { Button, Stack } from "@mantine/core";
import Link from "next/link";
import type { Ad } from "../context/AdsContext";
import AdCard from "../components/AdCard";
import ObituaryShareMenu from "../components/ObituaryShareMenu";
import { useLanguage } from "../context/language";

interface AdDetailsPageProps {
  ad: Ad;
  from?: string;
}

export default function AdDetailsPage({ ad, from }: AdDetailsPageProps) {
  const { t } = useLanguage();
  const backHref = from?.startsWith("/") && !from.startsWith("//") ? from : "/";

  return (
    <Stack className="ad-detail-page" gap="md">
      <Button component={Link} href={backHref}>
        {t("detail.backToList")}
      </Button>
      <AdCard ad={ad} />
      <ObituaryShareMenu ad={ad} />
    </Stack>
  );
}
