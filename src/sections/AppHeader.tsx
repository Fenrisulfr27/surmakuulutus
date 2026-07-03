import { Box, Button, Group } from "@mantine/core";
import { useNavigate } from "react-router-dom";

export function AppHeader() {
  const navigate = useNavigate();

  return (
    <Box component="header" className="app-header-section">
      <Group justify="space-between" align="center" p="lg">
        <Button
          onClick={() => navigate("/")}
          size="md"
          styles={{
            root: {
              backgroundColor: "transparent",
              border: 0,
              paddingInline: 0,
            },
            label: {
              color: "#e0d8bb",
              fontSize: "1rem",
            },
          }}
        >
          Avaleht
        </Button>
        <Group wrap="wrap">
          <Button onClick={() => navigate("/")} size="md">
            Surmakuulutused
          </Button>
          <Button onClick={() => navigate("/lisa-kuulutus")} size="md">
            Lisa kuulutus
          </Button>
        </Group>
      </Group>
    </Box>
  );
}
