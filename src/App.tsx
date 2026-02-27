import { Routes, Route, useNavigate } from "react-router-dom";
import "@mantine/core/styles.css";
import AddAdPage from "./pages/AddAdPage";
import HomePage from "./pages/HomePage";
import { AppShell, Button, Group } from "@mantine/core";
import AdDetailsPage from "./pages/AdDetailsPage";

export default function App() {
  const navigate = useNavigate();

  return (
    <AppShell header={{ height: 60 }} padding="10vh">
      <AppShell.Header withBorder={false}>
        <Group justify="space-between" h="100%" px="md">
          <div>Surmakuulutus.ee</div>
          <Group>
            <Button onClick={() => navigate("/")} variant="default">
              Surmakuulutused
            </Button>
            <Button
              onClick={() => navigate("/lisa-kuulutus")}
              variant="default"
            >
              Lisa kuulutus
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lisa-kuulutus" element={<AddAdPage />} />
          <Route path="/ads/:id" element={<AdDetailsPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
