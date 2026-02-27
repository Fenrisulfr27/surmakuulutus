import { Card, Text, Image, Flex } from "@mantine/core";
import cross from "../assets/cross.png";
import type { Ad } from "../context/AdsContext";
import { useHover } from "@mantine/hooks";
interface AdCardProps {
  ad: Ad;
  clampLines?: boolean;
  fixedLayout?: boolean;
}

export default function AdCard({
  ad,
  clampLines,
  fixedLayout = true,
}: AdCardProps) {
  const {
    firstName,
    lastName,
    birthYear,
    deathYear,
    poem,
    bottomText,
    topText,
  } = ad;
  const { hovered, ref } = useHover();
  return (
    <Card
      ref={ref}
      padding="sm"
      style={{
        width: 300,
        height: fixedLayout ? 500 : "auto", // 👈 oluline
        wordBreak: "break-word",
        transform: hovered ? "scale(1.05)" : "scale(1)",
        boxShadow: hovered ? "0 15px 40px rgba(255,255,255,0.6)" : "none",
        cursor: "pointer",
      }}
    >
      <Flex
        bg="rgba(0, 0, 0, .3)"
        align="center"
        direction="column"
        wrap="wrap"
        p="md"
        h="100%"
      >
        <Text
          mt="lg"
          fs="italic"
          lineClamp={clampLines ? 2 : undefined}
          h={fixedLayout ? "10%" : "auto"}
        >
          {poem || "luuletus..."}
        </Text>
        <Image src={cross} radius="md" h={150} w="auto" fit="contain" />
        <Text mt="lg" fs="italic" lineClamp={clampLines ? 2 : undefined}>
          {topText || "tekst..."}
        </Text>
        <Text fw={700} size="xl">
          {firstName || "Eesnimi"} {lastName || "Perekonnanimi"}
        </Text>
        <Text mt="sm" c="dimmed">
          {birthYear || "0000"} – {deathYear || "0000"}
        </Text>
        <Text mt="lg" fs="italic" lineClamp={clampLines ? 2 : undefined}>
          {bottomText || "tekst..."}
        </Text>
      </Flex>
    </Card>
  );
}
