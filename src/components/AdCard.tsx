import { Card, Text, Image, Flex } from "@mantine/core";
import cross from "../assets/cross.png";
import type { Ad } from "../context/AdsContext";

interface AdCardProps {
  ad: Ad;
  hoverable?: boolean;
  fixedLayout?: boolean;
}

export default function AdCard({ ad, hoverable }: AdCardProps) {
  const {
    firstName,
    lastName,
    birthYear,
    deathYear,
    poem,
    bottomText,
    topText,
  } = ad;

  return (
    <Card className={hoverable ? "homepage-card" : undefined}>
      <Flex align="center" direction="column">
        <Text>{poem || "luuletus..."}</Text>
        <Image src={cross} h={150} w="auto" />
        <Text>{topText || "tekst..."}</Text>
        <Text size="xl">
          {firstName || "Eesnimi"} {lastName || "Perekonnanimi"}
        </Text>
        <Text>
          {birthYear || "0000"} – {deathYear || "0000"}
        </Text>
        <Text>{bottomText || "tekst..."}</Text>
      </Flex>
    </Card>
  );
}
