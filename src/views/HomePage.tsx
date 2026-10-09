"use client";

import {
  Box,
  Button,
  Divider,
  Text,
  Anchor,
  Center,
  Loader,
  Pagination,
  Group,
  Stack,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const { t } = useLanguage();
  const [page, setPage] = useState(initialPage);
  const cardRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [cardHeight, setCardHeight] = useState<number>();

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

  useLayoutEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, data?.data.length ?? 0);
    const cards = cardRefs.current.filter(Boolean) as HTMLAnchorElement[];

    if (cards.length === 0) {
      setCardHeight(undefined);
      return;
    }

    setCardHeight(undefined);

    const frame = requestAnimationFrame(() => {
      setCardHeight(
        Math.ceil(Math.max(...cards.map((card) => card.scrollHeight))),
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [data?.data]);

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
      <h1
        style={{
          margin: 0,
          marginBottom: "2.5rem",
          textAlign: "center",
          width: "100%",
          maxWidth: "100%",
          paddingInline: "1rem",
          fontSize: "clamp(20px, 4.5vw, 72px)",
          lineHeight: 1,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          overflowWrap: "normal",
          wordBreak: "keep-all",
          display: "inline-block",
        }}
      >
        {t("home.title")}
      </h1>

      <Stack>
        <Group
          className="home-card-grid"
          justify="center"
          align="stretch"
          style={
            cardHeight
              ? ({ "--home-card-height": `${cardHeight}px` } as CSSProperties)
              : undefined
          }
        >
          {data?.data.length === 0 && (
            <Text ta="center">{t("home.empty")}</Text>
          )}

          {data?.data.map((ad, index) => (
            <Anchor
              component={Link}
              href={`/ads/${ad.slug}`}
              key={ad.slug}
              prefetch={false}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              className="home-card-link"
              underline="never"
            >
              <AdCard ad={ad} hoverable />
            </Anchor>
          ))}
        </Group>
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
        style={{
          position: "relative",
          marginTop: "3rem",
          minHeight: "clamp(220px, 50vw, 290px)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)), radial-gradient(circle at center, rgba(255,255,255,0.02), transparent 45%)",
          overflow: "hidden",
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
            <Divider color="rgba(255,255,255,0.14)" w={60} visibleFrom="sm" />
            <Text
              ta="center"
              style={{
                color: "#ddd7ce",
                letterSpacing: 6,
                textTransform: "uppercase",
                fontSize: "clamp(20px, 5vw, 54px)",
                lineHeight: 1.2,
              }}
            >
              {t("home.addAdHeading")}
            </Text>
            <Divider color="rgba(255,255,255,0.14)" w={60} visibleFrom="sm" />
          </Group>

          <Button
            component={Link}
            href="/lisa-kuulutus"
            size="md"
            radius={0}
            styles={{
              root: {
                background: "#ece5d8",
                color: "#111111",
                border: "1px solid rgba(255,255,255,0.14)",
                textTransform: "uppercase",
                letterSpacing: 2,
                minWidth: "clamp(200px, 60vw, 270px)",
                height: "clamp(40px, 8vw, 52px)",
              },
            }}
          >
            {t("home.addAdCta")}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
