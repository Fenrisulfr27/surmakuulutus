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
import { useCallback, useEffect, useRef, useState } from "react";
import AdCard from "../components/AdCard";
import type { AdsPageData, AdsSortOrder } from "../lib/ads";
import { useLanguage } from "../context/language";

interface HomePageProps {
  initialPage: number;
  initialData: AdsPageData;
  initialSearch: string;
  initialSort: AdsSortOrder;
}

export default function HomePage({
  initialPage,
  initialData,
  initialSearch,
  initialSort,
}: HomePageProps) {
  const { language, t } = useLanguage();
  const cardGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = cardGridRef.current;
    if (!grid) return;

    const rowHeight = 1;
    const gap = 8;
    const resizeCards = () => {
      for (const card of grid.children) {
        const span = Math.ceil((card.getBoundingClientRect().height + gap) / (rowHeight + gap));
        (card as HTMLElement).style.setProperty("--masonry-row-span", String(span));
      }
    };

    const observer = new ResizeObserver(resizeCards);
    for (const card of grid.children) observer.observe(card);
    resizeCards();
    return () => observer.disconnect();
  }, [initialData.data.length]);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [sortOrder, setSortOrder] = useState<AdsSortOrder>(initialSort);

  const limit = 12;

  const buildSearchParams = useCallback((nextPage: number, nextSearch: string, nextSort: AdsSortOrder) => {
    const params = new URLSearchParams();
    const cleanSearch = nextSearch.trim();

    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }

    if (cleanSearch) {
      params.set("search", cleanSearch);
    }

    if (nextSort !== "newest") {
      params.set("sort", nextSort);
    }

    return params.toString();
  }, []);

  const updateUrl = useCallback((nextPage: number, nextSearch: string, nextSort: AdsSortOrder, mode: "push" | "replace") => {
    const query = buildSearchParams(nextPage, nextSearch, nextSort);
    const nextUrl = query ? `/?${query}` : "/";

    if (window.location.pathname + window.location.search === nextUrl) {
      return;
    }

    if (mode === "replace") {
      window.history.replaceState(null, "", nextUrl);
    } else {
      window.history.pushState(null, "", nextUrl);
    }
  }, [buildSearchParams]);

  const listingQuery = buildSearchParams(page, debouncedSearch, sortOrder);
  const currentListingHref = listingQuery ? `/?${listingQuery}` : "/";

  const { data, isLoading, isError } = useQuery<AdsPageData, Error>({
    queryKey: ["ads", page, debouncedSearch.trim(), sortOrder],
    initialData:
      page === initialPage &&
      debouncedSearch === initialSearch &&
      sortOrder === initialSort
        ? initialData
        : undefined,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const query = buildSearchParams(page, debouncedSearch, sortOrder);
      const separator = query ? `&${query}` : "";
      const res = await fetch(`/api/ads?limit=${limit}${separator}`, { signal });
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
    updateUrl(value, debouncedSearch, sortOrder, "push");
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
    updateUrl(1, "", sortOrder, "replace");
  };

  const handleSortChange = (value: string) => {
    const nextSort = value === "oldest" ? "oldest" : "newest";
    setSortOrder(nextSort);
    setPage(1);
    updateUrl(1, debouncedSearch, nextSort, "push");
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    updateUrl(1, debouncedSearch, sortOrder, "replace");
  }, [debouncedSearch, sortOrder, updateUrl]);

  useEffect(() => {
    const syncFromLocation = () => {
      const params = new URLSearchParams(window.location.search);
      const nextPage = Math.max(Number(params.get("page")) || 1, 1);
      const nextSearch = params.get("search") ?? "";
      const nextSort = params.get("sort") === "oldest" ? "oldest" : "newest";

      setPage(nextPage);
      setSearch(nextSearch);
      setDebouncedSearch(nextSearch);
      setSortOrder(nextSort);
    };

    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

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
          <Group className="newspaper-tool-controls" align="end" gap="sm">
            <TextInput
              aria-label={t("home.searchLabel")}
              className="newspaper-search"
              placeholder={t("home.searchPlaceholder")}
              rightSection={
                search ? (
                  <button
                    aria-label={t("home.clearSearch")}
                    className="newspaper-clear-search"
                    onClick={handleClearSearch}
                    type="button"
                  >
                    x
                  </button>
                ) : undefined
              }
              rightSectionPointerEvents="all"
              value={search}
              onChange={(event) => handleSearchChange(event.currentTarget.value)}
            />
            <SegmentedControl
              aria-label={t("home.sortLabel")}
              className="newspaper-sort"
              data={[
                { label: t("home.sortNewest"), value: "newest" },
                { label: t("home.sortOldest"), value: "oldest" },
              ]}
              value={sortOrder}
              onChange={handleSortChange}
            />
          </Group>
          <Text className="newspaper-result-count">
            {data?.totalAds ?? 0} {t("home.resultCount")}
          </Text>
        </Group>

        <Text className="newspaper-section-heading">{t("home.sectionHeading")}</Text>

        <div className="home-card-grid" ref={cardGridRef}>
          {data?.data.length === 0 && (
            <Text className="newspaper-state" ta="center">
              {search ? t("home.noSearchResults") : t("home.empty")}
            </Text>
          )}

          {data?.data.map((ad) => (
            <Anchor
              component={Link}
              href={{
                pathname: `/kuulutused/${ad.slug}`,
                query: listingQuery ? { from: currentListingHref } : undefined,
              }}
              key={ad.slug}
              prefetch={false}
              className="home-card-link"
              underline="never"
            >
              <AdCard ad={ad} hoverable />
            </Anchor>
          ))}
        </div>
        {(data?.totalPages ?? 0) > 1 && (
          <Group justify="center">
            <Pagination
              value={page}
              onChange={handlePageChange}
              total={data?.totalPages || 1}
              p="lg"
            />
          </Group>
        )}
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
            <div>
              <Text ta="center" className="newspaper-submit-heading">
                {t("home.addAdHeading")}
              </Text>
              <Text ta="center" className="newspaper-submit-copy">
                {t("home.addAdIntro")}
              </Text>
            </div>
          </Group>

          <Button
            component={Link}
            href="/lisa-kuulutus"
            prefetch={false}
            size="md"
          >
            {t("home.addAdCta")}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
