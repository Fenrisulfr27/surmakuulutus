import { Routes, Route, useNavigate } from "react-router-dom";
import "@mantine/core/styles.css";
import AddAdPage from "./pages/AddAdPage";
import HomePage from "./pages/HomePage";
import { AppShell, Button, Container, Group } from "@mantine/core";
import AdDetailsPage from "./pages/AdDetailsPage";

export default function App() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <AppShell.Header withBorder={false} bg="secondary">
        <Group justify="end" p="md">
          <Group>
            <Button onClick={() => navigate("/")} size="md">
              Surmakuulutused
            </Button>
            <Button onClick={() => navigate("/lisa-kuulutus")} size="md">
              Lisa kuulutus
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <Container size="xl" pt={50} px="md">
        <AppShell.Main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/lisa-kuulutus" element={<AddAdPage />} />
            <Route path="/ads/:id" element={<AdDetailsPage />} />
          </Routes>
        </AppShell.Main>
      </Container>
    </AppShell>
  );
}
