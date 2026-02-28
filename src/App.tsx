import { Routes, Route, useNavigate } from "react-router-dom";
import "@mantine/core/styles.css";
import AddAdPage from "./pages/AddAdPage";
import HomePage from "./pages/HomePage";
import { AppShell, Button, Card, Group } from "@mantine/core";
import AdDetailsPage from "./pages/AdDetailsPage";

export default function App() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <AppShell.Header>
        <Group justify="space-between">
          <Button>Surmakuulutused</Button>
          <Group>
            <Button onClick={() => navigate("/")}>Surmakuulutused</Button>
            <Button onClick={() => navigate("/lisa-kuulutus")}>
              Lisa kuulutus
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Card></Card>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lisa-kuulutus" element={<AddAdPage />} />
          <Route path="/ads/:id" element={<AdDetailsPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
