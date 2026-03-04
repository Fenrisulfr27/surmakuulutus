import { Text, Anchor, Center, Loader } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import type { Ad } from "../context/AdsContext";
import AdCard from "../components/AdCard";

export default function HomePage() {
  const {
    data: ads,
    isLoading,
    isError,
  } = useQuery<Ad[], Error>({
    queryKey: ["ads"],
    queryFn: async () => {
      const res = await fetch("https://surmakuulutus-back.onrender.com/ads");
      if (!res.ok) throw new Error("Andmete laadimine ebaõnnestus");
      return res.json();
    },
  });
  if (isLoading) {
    return (
      <Center style={{ height: "50vh" }}>
        <Loader />
      </Center>
    );
  }

  if (isError) {
    return <Text>Kuulutuste laadimine ebaõnnestus.</Text>;
  }

  return (
    <>
      {ads && ads.length === 0 && <Text>Kuulutusi pole veel lisatud.</Text>}

      {ads?.map((ad) => (
        <Anchor href={`/ads/${ad._id}`} key={ad._id} underline="never">
          <AdCard ad={ad} hoverable />
        </Anchor>
      ))}
    </>
  );
}
