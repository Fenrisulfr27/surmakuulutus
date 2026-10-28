import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { pageAdministrator } from "../../lib/adminPage";
import { AdminLogout } from "../../components/admin/AdminAuthForms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata: Metadata = { title: "Administreerimine", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const administrator = await pageAdministrator();
  return <section className="admin-page">
    <p className="newspaper-date">ADMINISTREERIMINE</p>
    {administrator && <nav className="admin-nav" aria-label="Administreerimine">
      <Link href="/admin">Ülevaade</Link><Link href="/admin/kuulutused">Kuulutused</Link>
      <Link href="/admin/logi">Logi</Link><AdminLogout />
    </nav>}
    {children}
  </section>;
}
