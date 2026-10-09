"use client";

import {
  Box,
  Button,
  Text,
  Anchor,
  Center,
  Loader,
  Pagination,
  Group,
  Stack,
  TextInput,
  SegmentedControl,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Ad } from "../context/AdsContext";
import AdCard from "../components/AdCard";
import type { AdsPageData } from "../lib/ads";
import { useLanguage } from "../context/language";

interface HomePageProps {
  initialPage: number;
  initialData: AdsPageData;
}

export default function HomePage({ initialPage, initialData }: HomePageProps) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const limit = 12;

  useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

  const { data, isLoading, isError } = useQuery<
    {
      data: Ad[];
      totalPages: number;
    },
    Error
  >({
    queryKey: ["ads", page],
    initialData: page === initialPage ? initialData : undefined,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch(`/api/ads?page=${page}&limit=${limit}`);
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(payload?.error ?? t("home.loadError"));
      }
      return res.json();
    },
    placeholderData: (previousData) => previousData,
    retry: false,
  });

  const handlePageChange = (value: number) => {
    setPage(value);
    router.push(`/?page=${value}`);
  };

  const visibleAds = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase(language);
    const adTime = (ad: Ad) => {
      const value = ad.deathYear ?? ad.birthYear;
      const timestamp = value ? new Date(value).getTime() : 0;
      return Number.isFinite(timestamp) ? timestamp : 0;
    };

    return [...(data?.data ?? [])]
      .filter((ad) =>
        ad.name.toLocaleLowerCase(language).includes(normalizedSearch),
      )
      .sort((a, b) =>
        sortOrder === "newest" ? adTime(b) - adTime(a) : adTime(a) - adTime(b),
      );
  }, [data?.data, language, search, sortOrder]);

  if (isLoading) {
    return (
      <Center style={{ height: "50vh" }}>
        <Loader />
      </Center>
    );
  }

  if (isError) {
    return (
      <Text>
        {data
          ? t("home.loadError")
          : t("home.loadConfigError")}
      </Text>
    );
  }

  return (
    <Box w="100%">
      <section className="newspaper-masthead" aria-labelledby="home-title">
        <Text className="newspaper-date">
          {new Intl.DateTimeFormat(language, {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }).format(new Date())}
        </Text>
        <h1 id="home-title">{t("home.title")}</h1>
        <Text className="newspaper-subtitle">
          {language === "et" ? "Mälestused, mis jäävad" : "Memories that remain"}
        </Text>
      </section>

      <Stack gap="xl">
        <Group className="newspaper-tools" justify="space-between" align="end">
          <TextInput
            aria-label={language === "et" ? "Otsi nime järgi" : "Search by name"}
            className="newspaper-search"
            placeholder={language === "et" ? "Otsi nime järgi" : "Search by name"}
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
          <SegmentedControl
            aria-label={language === "et" ? "Sorteeri kuulutusi" : "Sort obituaries"}
            className="newspaper-sort"
            data={[
              { label: language === "et" ? "Uuemad" : "Newest", value: "newest" },
              { label: language === "et" ? "Vanemad" : "Oldest", value: "oldest" },
            ]}
            value={sortOrder}
            onChange={(value) => setSortOrder(value as "newest" | "oldest")}
          />
        </Group>

        <div className="home-card-grid">
          {visibleAds.length === 0 && (
            <Text className="newspaper-state" ta="center">
              {search ? (language === "et" ? "Selle nimega kuulutusi ei leitud." : "No obituaries match that name.") : t("home.empty")}
            </Text>
          )}

          {visibleAds.map((ad) => (
            <Anchor
              component={Link}
              href={`/ads/${ad.slug}`}
              key={ad.slug}
              prefetch={false}
              className="home-card-link"
              underline="never"
            >
              <AdCard ad={ad} hoverable />
            </Anchor>
          ))}
        </div>
        <Group justify="center">
          <Pagination
            value={page}
            onChange={handlePageChange}
            total={data?.totalPages || 1}
            p="lg"
          />
        </Group>
      </Stack>
      <Box
        className="newspaper-submit-band"
        style={{
          position: "relative",
        }}
      >
        <Stack
          align="center"
          justify="center"
          gap="lg"
          style={{
            position: "relative",
            zIndex: 1,
            minHeight: "inherit",
            padding: "20px 16px",
          }}
        >
          <Group gap="md" align="center" wrap="nowrap" justify="center">
            <Text ta="center" className="newspaper-submit-heading">
              {t("home.addAdHeading")}
            </Text>
          </Group>

          <Button
            component={Link}
            href="/lisa-kuulutus"
            size="md"
          >
            {t("home.addAdCta")}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
