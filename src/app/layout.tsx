import type { Metadata } from "next";
import { Container } from "@mantine/core";
import type { ReactNode } from "react";
import { AppHeader } from "../sections/AppHeader";
import { Providers } from "./providers";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "../style.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://surmakuulutus.ee";

const siteName = "Surmakuulutus.ee";

const siteDescription =
  "Leia surmakuulutusi, leinakuulutusi ja mälestuskuulutusi üle Eesti. Avalda lähedase surmakuulutus ning hoia tema mälestust.";

const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  inLanguage: "et-EE",
  description: siteDescription,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  applicationName: siteName,

  title: {
    default: "Surmakuulutused Eestis",
    template: "%s | Surmakuulutus.ee",
  },

  description: siteDescription,
  keywords: [
    "surmakuulutused",
    "surmakuulutus",
    "leinakuulutused",
    "leinakuulutus",
    "mälestuskuulutused",
    "mälestuskuulutus",
  ],

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "et_EE",
    siteName,
    title: "Surmakuulutused Eestis | Surmakuulutus.ee",
    description: siteDescription,
    images: [
      {
        url: "/og-preview.webp",
        width: 1200,
        height: 630,
        alt: "Surmakuulutus.ee – surmakuulutused Eestis",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Surmakuulutused Eestis | Surmakuulutus.ee",
    description: siteDescription,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
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
