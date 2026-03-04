import { Routes, Route, useNavigate } from "react-router-dom";
import "@mantine/core/styles.css";
import AddAdPage from "./pages/AddAdPage";
import HomePage from "./pages/HomePage";
import { AppShell, Button, Container, Group } from "@mantine/core";
import AdDetailsPage from "./pages/AdDetailsPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function App() {
  const navigate = useNavigate();

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell style={{ minWidth: 320 }}>
        {/* Header */}
        <AppShell.Header withBorder={false} bg="secondary">
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

        {/* Main content */}
        <AppShell.Main>
          <Container size="xl" pt={150} px="md">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/lisa-kuulutus" element={<AddAdPage />} />
              <Route path="/ads/:id" element={<AdDetailsPage />} />
            </Routes>
          </Container>
        </AppShell.Main>
      </AppShell>
    </QueryClientProvider>
  );
}
