import {
  Text,
  Anchor,
  Center,
  Loader,
  Pagination,
  Group,
  Stack,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import type { Ad } from "../context/AdsContext";
import AdCard from "../components/AdCard";

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const limit = 12;

  const { data, isLoading, isError } = useQuery<
    {
      data: Ad[];
      totalPages: number;
    },
    Error
  >({
    queryKey: ["ads", page],
    queryFn: async () => {
      const res = await fetch(
        `https://surmakuulutus-back.onrender.com/ads?page=${page}&limit=${limit}`,
      );
      if (!res.ok) throw new Error("Andmete laadimine ebaõnnestus");
      return res.json();
    },
    placeholderData: (previousData) => previousData,
  });

  const handlePageChange = (value: number) => {
    setSearchParams({ page: value.toString() });
  };

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
      <Stack>
        <Group justify="center">
          {data?.data.length === 0 && (
            <Text ta="center">Kuulutusi pole veel lisatud.</Text>
          )}

          {data?.data.map((ad) => (
            <Anchor href={`/ads/${ad._id}`} key={ad._id} underline="never">
              <AdCard ad={ad} hoverable />
            </Anchor>
          ))}
        </Group>
        <Group justify="center">
          <Pagination
            value={page}
            onChange={handlePageChange}
            total={data?.totalPages || 1}
            p="lg"
          />
        </Group>
      </Stack>
    </>
  );
}
