import { Card, Text, Image, Flex, Group } from "@mantine/core";
import cross from "../assets/cross2.webp";
import type { Ad } from "../context/AdsContext";
import dayjs from "dayjs";
import "dayjs/locale/et";
interface AdCardProps {
  ad: Ad;
  hoverable?: boolean;
  fixedLayout?: boolean;
}

export default function AdCard({ ad, hoverable }: AdCardProps) {
  const { name, birthYear, deathYear, poem, bottomText, topText } = ad;

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
            <Image
              src={cross}
              h={50}
              w="auto"
              alt="cross"
              fetchPriority="high"
            />
            <Text fs="italic">{poem}</Text>
          </Group>

          <Text pt="lg">{topText}</Text>
          <Text size="xl" fw={700}>
            {name}
          </Text>
          <Text c="dimmed">
            <Text c="dimmed">
              {birthYear && deathYear
                ? `${dayjs(birthYear).format("DD.MM.YYYY")} – ${dayjs(deathYear).format("DD.MM.YYYY")}`
                : birthYear
                  ? dayjs(birthYear).format("DD.MM.YYYY")
                  : deathYear
                    ? dayjs(deathYear).format("DD.MM.YYYY")
                    : ""}
            </Text>
          </Text>
          <Text>{bottomText}</Text>
        </Flex>
      </div>
    </Card>
  );
}
