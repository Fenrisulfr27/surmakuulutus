import type { Metadata } from "next";
import AddAdPage from "../../views/AddAdPage";

export const metadata: Metadata = {
  title: "Lisa surmakuulutus",
  description:
    "Lisa surmakuulutus või mälestuskuulutus lähedase mälestuseks. Kuulutus avaldatakse veebis nime järgi leitavana.",
  keywords: [
    "lisa surmakuulutus",
    "surmakuulutus",
    "mälestuskuulutus",
    "leinakuulutus",
  ],
  alternates: {
    canonical: "/lisa-kuulutus",
  },
  openGraph: {
    title: "Lisa surmakuulutus",
    description:
      "Avalda surmakuulutus või mälestuskuulutus lähedase mälestuseks.",
    url: "/lisa-kuulutus",
  },
};

export default function Page() {
  return <AddAdPage />;
}
