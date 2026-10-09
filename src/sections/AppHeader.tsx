"use client";

import { Box, Button, Group } from "@mantine/core";
import Link from "next/link";
import { useLanguage } from "../context/language";

export function AppHeader() {
  const { language, setLanguage, t } = useLanguage();

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
          {t("nav.home")}
        </Button>
        <Group wrap="wrap">
          <Button component={Link} href="/" size="md">
            {t("nav.ads")}
          </Button>
          <Button component={Link} href="/lisa-kuulutus" size="md">
            {t("nav.addAd")}
          </Button>
          <Button
            size="md"
            onClick={() => setLanguage(language === "et" ? "en" : "et")}
          >
            {language === "et" ? "ENG" : "EST"}
          </Button>
        </Group>
      </Group>
    </Box>
  );
}
