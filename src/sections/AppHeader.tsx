"use client";

import { Box, Button, Group } from "@mantine/core";
import Link from "next/link";

export function AppHeader() {
  return (
    <Box component="header" className="app-header-section">
      <Group justify="space-between" align="center" p="lg">
        <Button
          component={Link}
          href="/"
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
          <Button component={Link} href="/" size="md">
            Surmakuulutused
          </Button>
          <Button component={Link} href="/lisa-kuulutus" size="md">
            Lisa kuulutus
          </Button>
        </Group>
      </Group>
    </Box>
  );
}
