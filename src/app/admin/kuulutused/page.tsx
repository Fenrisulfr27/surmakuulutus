import { listAdminAds } from "../../../lib/adminAds";
import { requirePageAdministrator } from "../../../lib/adminPage";
import { AdminFilters, AdminPagination, AdminTable } from "../../../components/admin/AdminTable";

export default async function AdminAdsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePageAdministrator();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }
  const result = await listAdminAds(query);
  return <>
    <h1>Kuulutused</h1>
    <AdminFilters key={query.toString()} query={query.toString()} />
    <p>Leitud: {result.total}</p>
    <AdminTable rows={result.rows} />
    <AdminPagination page={result.currentPage} pages={result.pages} path="/admin/kuulutused" query={query.toString()} />
  </>;
}
