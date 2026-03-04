import { Routes, Route, useNavigate } from "react-router-dom";
import "@mantine/core/styles.css";
import AddAdPage from "./pages/AddAdPage";
import HomePage from "./pages/HomePage";
import { AppShell, Button, Container, Flex, Group, Image } from "@mantine/core";
import AdDetailsPage from "./pages/AdDetailsPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import logo from "./assets/surmakuulutusedLogo.png";

const queryClient = new QueryClient();

export default function App() {
  const navigate = useNavigate();

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <AppShell.Header withBorder={false}>
          <Container size="xl">
            <Group justify="end" p="md">
              <Group wrap="wrap">
                <Button onClick={() => navigate("/")} size="md">
                  Surmakuulutused
                </Button>
                <Button onClick={() => navigate("/lisa-kuulutus")} size="md">
                  Lisa kuulutus
                </Button>
              </Group>
            </Group>
          </Container>
        </AppShell.Header>

        <AppShell.Main>
          <Flex justify="center" mb="xl" pt={150}>
            <Image src={logo} h={{ base: 100, sm: 150, md: 200 }} w="auto" />
          </Flex>

          <Flex direction="row" wrap="wrap" justify="center" gap="lg">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/lisa-kuulutus" element={<AddAdPage />} />
              <Route path="/ads/:id" element={<AdDetailsPage />} />
            </Routes>
          </Flex>
        </AppShell.Main>
      </AppShell>
    </QueryClientProvider>
  );
}
