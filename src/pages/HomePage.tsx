import { useState, useEffect } from "react";
import { Text, Flex, Anchor, Image } from "@mantine/core";
import type { Ad } from "../context/AdsContext";
import AdCard from "../components/AdCard";
import logo from "../assets/surmakuulutusedLogo.png";

export default function HomePage() {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/ads")
      .then((res) => res.json())
      .then((data: Ad[]) => setAds(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <>
      <Flex justify="center">
        <Image src={logo} h={200} w="auto" p="lg" />
      </Flex>
      {ads.length === 0 && <Text>Kuulutusi pole veel lisatud.</Text>}

      <Flex align="center" direction="row" wrap="wrap" gap="lg">
        {ads.map((ad) => (
          <Anchor href={`/ads/${ad._id}`} key={ad._id} underline="never">
            <AdCard ad={ad} hoverable={true} />
          </Anchor>
        ))}
      </Flex>
    </>
  );
}
