import { Card, Text, Image, Flex, Group } from "@mantine/core";
import cross from "../assets/cross2.png";
import type { Ad } from "../context/AdsContext";

interface AdCardProps {
  ad: Ad;
  hoverable?: boolean;
  fixedLayout?: boolean;
}

export default function AdCard({ ad, hoverable }: AdCardProps) {
  const {
    firstName,

    birthYear,
    deathYear,
    poem,
    bottomText,
    topText,
  } = ad;

  return (
    <Card
      className={hoverable ? "homepage-card" : undefined}
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
    >
      <div className="card-inner">
        <Flex align="center" direction="column">
          <Group justify="start" wrap="nowrap">
            <Image src={cross} h={50} w="auto" />
            <Text fs="italic">{poem}</Text>
          </Group>

          <Text pt="lg">{topText}</Text>
          <Text size="xl" fw={700}>
            {firstName}
          </Text>
          <Text c="dimmed">
            {birthYear && deathYear
              ? `${birthYear} – ${deathYear}`
              : birthYear || deathYear}
          </Text>
          <Text>{bottomText}</Text>
        </Flex>
      </div>
    </Card>
  );
}
