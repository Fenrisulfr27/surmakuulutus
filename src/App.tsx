import { Routes, Route, useNavigate } from "react-router-dom";
import "@mantine/core/styles.css";
import AddAdPage from "./pages/AddAdPage";
import HomePage from "./pages/HomePage";
import { AppShell, Button, Container, Group } from "@mantine/core";
import AdDetailsPage from "./pages/AdDetailsPage";

export default function App() {
  const navigate = useNavigate();

  return (
    <AppShell style={{ minWidth: 320 }}>
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
  );
}
