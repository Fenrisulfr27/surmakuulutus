import { useParams } from "react-router-dom";
import { Text, Center } from "@mantine/core";
import { useEffect, useState } from "react";
import type { Ad } from "../context/AdsContext";
import AdCard from "../components/AdCard";

export default function AdDetailsPage() {
  const { id } = useParams();
  const [ad, setAd] = useState<Ad | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchAd = async () => {
      try {
        const res = await fetch(
          `https://surmakuulutus-back.onrender.com/ads/${id}`,
        );

        if (!res.ok) {
          setNotFound(true);
          return;
        }

        const data: Ad = await res.json();
        setAd(data);
      } catch (err) {
        console.error(err);
        setNotFound(true);
      }
    };

    fetchAd();
  }, [id]);

  if (ad === null && !notFound) return null;
  if (notFound) {
    return (
      <Center>
        <Text>Kuulutust ei leitud.</Text>
      </Center>
    );
  }

  if (!ad) return null;
  return <AdCard ad={ad} />;
}
