import type { Metadata } from "next";
import AddAdPage from "../../views/AddAdPage";

export const metadata: Metadata = {
  title: "Lisa kuulutus – Surmakuulutused",
};

export default function Page() {
  return <AddAdPage />;
}
