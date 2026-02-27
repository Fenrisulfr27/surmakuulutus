import { useState, useEffect } from "react";
import { Text, Flex } from "@mantine/core";
import { Link } from "react-router-dom";
import type { Ad } from "../context/AdsContext";
import AdCard from "../components/AdCard";

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
      <h1>Kuulutused</h1>
      {ads.length === 0 && <Text>Kuulutusi pole veel lisatud.</Text>}

      <Flex gap="lg" align="center" direction="row" wrap="wrap" p="md">
        {ads.map((ad) => (
          <Link
            to={`/ads/${ad._id}`}
            key={ad._id}
            style={{ textDecoration: "none" }}
          >
            <AdCard ad={ad} clampLines={true} fixedLayout={true} />
          </Link>
        ))}
      </Flex>
    </>
  );
}
