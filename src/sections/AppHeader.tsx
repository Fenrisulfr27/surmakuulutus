"use client";

import { Box, Button, Group, useMantineColorScheme } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../context/language";
import moonButton from "../assets/kuu_button.svg";
import sunButton from "../assets/paike_button.svg";

export function AppHeader() {
  const { language, setLanguage, t } = useLanguage();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const pathname = usePathname();
  const nextColorScheme = colorScheme === "dark" ? "light" : "dark";

  return (
    <Box component="header" className="app-header-section">
      <Group justify="space-between" align="center" p="md" className="newspaper-nav">
        <Button
          component={Link}
          href="/"
          size="md"
          className="app-brand-button"
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
        <Group wrap="wrap" gap="xs" className="newspaper-nav-actions">
          <Button
            component={Link}
            href="/"
            size="compact-sm"
            className={pathname === "/" ? "nav-button-active" : undefined}
          >
            {t("nav.ads")}
          </Button>
          <Button
            component={Link}
            href="/lisa-kuulutus"
            size="compact-sm"
            className={pathname === "/lisa-kuulutus" ? "nav-button-active" : undefined}
          >
            {t("nav.addAd")}
          </Button>
          <div className="language-switch" aria-label="Language">
            <button
              type="button"
              className={language === "et" ? "language-switch-active" : undefined}
              onClick={() => setLanguage("et")}
            >
              ET
            </button>
            <span aria-hidden="true" />
            <button
              type="button"
              className={language === "en" ? "language-switch-active" : undefined}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
          </div>
          <Button
            size="compact-sm"
            aria-label={nextColorScheme === "dark" ? t("nav.darkMode") : t("nav.lightMode")}
            title={nextColorScheme === "dark" ? t("nav.darkMode") : t("nav.lightMode")}
            className="theme-image-button"
            onClick={() => setColorScheme(nextColorScheme)}
          >
            <img
              src={nextColorScheme === "dark" ? moonButton.src : sunButton.src}
              alt=""
              aria-hidden="true"
            />
          </Button>
        </Group>
      </Group>
    </Box>
  );
}
