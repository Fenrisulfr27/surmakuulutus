"use client";

import { Card, Text, Image, Flex, Group } from "@mantine/core";
import cross from "../assets/cross2.webp";
import type { Ad } from "../context/AdsContext";
import dayjs from "dayjs";
import "dayjs/locale/et";
import { useLanguage } from "../context/language";
interface AdCardProps {
  ad: Ad;
  hoverable?: boolean;
  fixedLayout?: boolean;
}

export default function AdCard({ ad, hoverable }: AdCardProps) {
  const { t } = useLanguage();
  const { name, birthYear, deathYear, poem, bottomText, topText } = ad;
  const hasOnlyName = !birthYear && !deathYear && !poem && !bottomText && !topText;
  const dateLabel =
    birthYear && deathYear
      ? `${dayjs(birthYear).format("DD.MM.YYYY")} – ${dayjs(deathYear).format("DD.MM.YYYY")}`
      : birthYear
        ? dayjs(birthYear).format("DD.MM.YYYY")
        : deathYear
          ? dayjs(deathYear).format("DD.MM.YYYY")
          : "";

  return (
    <Card
      className={[
        hoverable ? "homepage-card" : "",
        "newspaper-card",
        hasOnlyName ? "newspaper-card-compact" : "",
      ].filter(Boolean).join(" ")}
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
    >
      <div className="card-inner">
        <Flex
          align="center"
          className="newspaper-card-content"
          direction="column"
        >
          {topText && (
            <Text className="newspaper-kicker" style={{ whiteSpace: "pre-wrap" }}>
              {topText}
            </Text>
          )}

          <Text className="newspaper-name" size="xl" fw={700}>
            {name}
          </Text>

          {dateLabel && (
            <Text className="newspaper-dates" component="span">
              {dateLabel}
            </Text>
          )}

          {(poem || bottomText) && <div className="newspaper-separator" />}

          {poem && (
            <Group className="newspaper-poem-row" justify="start" wrap="nowrap">
              <Image
                src={cross.src}
                h={36}
                w="auto"
                alt={t("card.crossAlt")}
                fetchPriority="high"
              />
              <Text className="newspaper-poem" fs="italic" style={{ whiteSpace: "pre-wrap" }}>
                {poem}
              </Text>
            </Group>
          )}

          {bottomText && (
            <Text className="newspaper-footer" style={{ whiteSpace: "pre-wrap" }}>
              {bottomText}
            </Text>
          )}
        </Flex>
      </div>
    </Card>
  );
}
