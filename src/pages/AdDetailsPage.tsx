import { useParams } from "react-router-dom";
import { Text, Center, Loader } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import type { Ad } from "../context/AdsContext";
import AdCard from "../components/AdCard";

export default function AdDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: ad,
    isLoading,
    isError,
  } = useQuery<Ad, Error>({
    queryKey: ["ad", id],
    queryFn: async () => {
      if (!id) throw new Error("Kuulutuse ID puudub");
      const res = await fetch(
        `https://surmakuulutus-back.onrender.com/ads/${id}`,
      );
      if (!res.ok) throw new Error("Kuulutust ei leitud");
      return res.json();
    },
    enabled: !!id,
  });
  if (isLoading) {
    return (
      <Center style={{ height: "50vh" }}>
        <Loader />
      </Center>
    );
  }

  if (isError || !ad) {
    return <Text>Kuulutust ei leitud.</Text>;
  }

  return <AdCard ad={ad} />;
}
