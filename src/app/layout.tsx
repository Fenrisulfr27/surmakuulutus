import type { Metadata } from "next";
import { Container } from "@mantine/core";
import type { ReactNode } from "react";
import { AppHeader } from "../sections/AppHeader";
import { Providers } from "./providers";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "../style.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://surmakuulutus.netlify.app",
  ),
  title: {
    default: "Surmakuulutused – mälestuskuulutused Eestis",
    template: "%s",
  },
  description:
    "Avalda ja leia surmakuulutusi nime järgi. Rahulik veebileht lahkunute mälestuseks.",
  keywords: ["surmakuulutused", "mälestuskuulutus", "obituaries", "leinakuulutus"],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Surmakuulutused – mälestuskuulutused Eestis",
    description:
      "Avalda ja leia surmakuulutusi nime järgi.",
    images: ["/og-preview.webp"],
    siteName: "Surmakuulutused",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Surmakuulutused – mälestuskuulutused Eestis",
    description:
      "Avalda ja leia surmakuulutusi nime järgi.",
    images: ["/og-preview.webp"],
  },
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
