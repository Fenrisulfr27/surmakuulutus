import type { Metadata } from "next";
import { Container } from "@mantine/core";
import type { ReactNode } from "react";
import { AppHeader } from "../sections/AppHeader";
import { Providers } from "./providers";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "../style.css";

export const metadata: Metadata = {
  title: "Surmakuulutused – Avaleht",
  description:
    "Surmakuulutused – avalda lahkunute mälestuseks kuulutusi ja hoia mälestusi elus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="et">
      <body>
        <Providers>
          <Container size="xl">
            <AppHeader />
            <main className="app-main-section">{children}</main>
          </Container>
        </Providers>
      </body>
    </html>
  );
}