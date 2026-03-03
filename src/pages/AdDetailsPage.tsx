import { useParams } from "react-router-dom";
import { Text } from "@mantine/core";
import { useEffect, useState } from "react";
import type { Ad } from "../context/AdsContext";
import AdCard from "../components/AdCard";

export default function AdDetailsPage() {
  const { id } = useParams();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`https://surmakuulutus-back.onrender.com/ads/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setAd(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);
  if (loading) return <Text>Laadimine...</Text>;
  if (!ad) return <Text>Kuulutust ei leitud.</Text>;

  return <AdCard ad={ad} />;
}
