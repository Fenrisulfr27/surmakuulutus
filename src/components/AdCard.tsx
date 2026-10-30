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
  examplePreview?: boolean;
}

export default function AdCard({ ad, hoverable, examplePreview = false }: AdCardProps) {
  const { t } = useLanguage();
  const displayAd = { ...ad };
  const examples = {
    name: t("form.namePlaceholder"),
    topText: t("form.topTextPlaceholder"),
    poem: t("form.poemPlaceholder"),
    bottomText: t("form.mournersPlaceholder"),
    birthYear: t("form.birthDatePlaceholder").split(".").reverse().join("-"),
    deathYear: t("form.deathDatePlaceholder").split(".").reverse().join("-"),
  };
  const exampleFields = new Set<keyof typeof examples>();
  if (examplePreview) {
    for (const field of Object.keys(examples) as (keyof typeof examples)[]) {
      const value = ad[field];
      if (!value || (typeof value === "string" && !value.trim())) {
        displayAd[field] = examples[field];
        exampleFields.add(field);
      }
    }
  }
  const { name, birthYear, deathYear, poem, bottomText, topText } = displayAd;
  const hasOnlyName = !birthYear && !deathYear && !poem && !bottomText && !topText;

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
            <Text className="newspaper-kicker" data-example={exampleFields.has("topText") || undefined} style={{ whiteSpace: "pre-wrap" }}>
              {topText}
            </Text>
          )}

          <div className="newspaper-identity">
            <Text className="newspaper-name" data-example={exampleFields.has("name") || undefined} size="xl" fw={700}>
              {name}
            </Text>

            {(birthYear || deathYear) && (
              <Text className="newspaper-dates" component="span">
                {birthYear && <span data-example={exampleFields.has("birthYear") || undefined}>{dayjs(birthYear).format("DD.MM.YYYY")}</span>}
                {birthYear && deathYear && " – "}
                {deathYear && <span data-example={exampleFields.has("deathYear") || undefined}>{dayjs(deathYear).format("DD.MM.YYYY")}</span>}
              </Text>
            )}
          </div>

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
              <Text className="newspaper-poem" data-example={exampleFields.has("poem") || undefined} fs="italic" style={{ whiteSpace: "pre-wrap" }}>
                {poem.replace(/\\n/g, "\n")}
              </Text>
            </Group>
          )}

          {poem && bottomText && <div className="newspaper-text-divider" aria-hidden="true" />}

          {bottomText && (
            <Text className="newspaper-footer" data-example={exampleFields.has("bottomText") || undefined} style={{ whiteSpace: "pre-wrap" }}>
              {bottomText}
            </Text>
          )}
        </Flex>
      </div>
    </Card>
  );
}
