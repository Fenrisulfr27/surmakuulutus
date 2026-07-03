import {
  Box,
  Button,
  Divider,
  Text,
  Anchor,
  Center,
  Loader,
  Pagination,
  Group,
  Stack,
  Flex,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Ad } from "../context/AdsContext";
import AdCard from "../components/AdCard";

export default function HomePage() {
  const navigate = useNavigate();
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
    <Box w="100%">
      <Flex justify="center" className="app-title-section app-brand-section">
        <h1
          style={{
            margin: 0,
            textAlign: "center",
            width: "100%",
            maxWidth: "100%",
            paddingInline: "1rem",
            fontSize: "clamp(34px, 6vw, 72px)",
            lineHeight: 1,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            overflowWrap: "anywhere",
          }}
        >
          Surmakuulutused
        </h1>
      </Flex>
      <Stack>
        <Group justify="center">
          {data?.data.length === 0 && (
            <Text ta="center">Kuulutusi pole veel lisatud.</Text>
          )}

          {data?.data.map((ad) => (
            <Anchor href={`/ads/${ad.slug}`} key={ad.slug} underline="never">
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
      <Box
        style={{
          position: "relative",
          marginTop: "3rem",
          minHeight: "clamp(220px, 50vw, 290px)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)), radial-gradient(circle at center, rgba(255,255,255,0.02), transparent 45%)",
          overflow: "hidden",
        }}
      >
        <Stack
          align="center"
          justify="center"
          gap="lg"
          style={{
            position: "relative",
            zIndex: 1,
            minHeight: "inherit",
            padding: "20px 16px",
          }}
        >
          <Group gap="md" align="center" wrap="nowrap" justify="center">
            <Divider color="rgba(255,255,255,0.14)" w={60} visibleFrom="sm" />
            <Text
              ta="center"
              style={{
                color: "#ddd7ce",
                letterSpacing: 6,
                textTransform: "uppercase",
                fontSize: "clamp(20px, 5vw, 54px)",
                lineHeight: 1.2,
              }}
            >
              Lisa kuulutus
            </Text>
            <Divider color="rgba(255,255,255,0.14)" w={60} visibleFrom="sm" />
          </Group>

          <Button
            onClick={() => navigate("/lisa-kuulutus")}
            size="md"
            radius={0}
            styles={{
              root: {
                background: "#ece5d8",
                color: "#111111",
                border: "1px solid rgba(255,255,255,0.14)",
                textTransform: "uppercase",
                letterSpacing: 2,
                minWidth: "clamp(200px, 60vw, 270px)",
                height: "clamp(40px, 8vw, 52px)",
              },
            }}
          >
            Lisama
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
