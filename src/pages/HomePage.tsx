import { useState, useEffect } from "react";
import { Text, Flex, Anchor, Image } from "@mantine/core";
import type { Ad } from "../context/AdsContext";
import AdCard from "../components/AdCard";
import logo from "../assets/surmakuulutusedLogo.png";

export default function HomePage() {
  const [ads, setAds] = useState<Ad[] | null>(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await fetch(
          "https://surmakuulutus-back.onrender.com/ads",
        );

        if (!response.ok) {
          throw new Error("Andmete laadimine ebaõnnestus");
        }

        const data: Ad[] = await response.json();
        setAds(data);
      } catch (err) {
        console.error(err);
        setAds([]);
      }
    };

    fetchAds();
  }, []);

  return (
    <>
      <Flex justify="center">
        <Image src={logo} h={{ base: 100, sm: 150, md: 200 }} w="auto" p="lg" />
      </Flex>
      {ads === null && null}
      {ads !== null && ads.length === 0 && (
        <Text>Kuulutusi pole veel lisatud.</Text>
      )}
      {ads !== null && ads.length > 0 && (
        <Flex align="center" direction="row" wrap="wrap" gap="lg">
          {ads.map((ad) => (
            <Anchor href={`/ads/${ad._id}`} key={ad._id} underline="never">
              <AdCard ad={ad} hoverable />
            </Anchor>
          ))}
        </Flex>
      )}
    </>
  );
}
