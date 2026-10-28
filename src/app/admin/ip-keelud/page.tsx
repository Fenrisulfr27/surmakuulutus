import { requirePageAdministrator } from "../../../lib/adminPage";
import { listIpBans } from "../../../lib/ipBans";
import AdminIpBans from "../../../components/admin/AdminIpBans";
import { AdminPagination } from "../../../components/admin/AdminTable";

export default async function AdminIpBansPage({ searchParams }: { searchParams: Promise<{ ip?: string; page?: string }> }) {
  await requirePageAdministrator();
  const params = await searchParams;
  const query = new URLSearchParams();
  if (typeof params.ip === "string") query.set("ip", params.ip.slice(0, 45));
  if (typeof params.page === "string") query.set("page", params.page);
  const result = await listIpBans(query);
  return <><h1>IP-keelud</h1><p>Keelud kehtivad kuni tühistamiseni ja takistavad uute kuulutuste saatmist.</p>
    <p>Blokeeritud: {result.total}</p><AdminIpBans key={query.toString()} rows={result.rows} search={query.get("ip") ?? ""} />
    <AdminPagination path="/admin/ip-keelud" page={result.currentPage} pages={result.pages} query={query.toString()} /></>;
}
