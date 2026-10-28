import { requirePageAdministrator } from "../../../lib/adminPage";
import { listAdminActivity } from "../../../lib/adminAudit";
import { positiveInteger } from "../../../lib/moderation";
import { AdminPagination } from "../../../components/admin/AdminTable";
import AdminLog from "../../../components/admin/AdminLog";

export default async function AdminLogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requirePageAdministrator();
  const result = await listAdminActivity(positiveInteger((await searchParams).page, 1));
  return <><h1>Tegevuslogi</h1><AdminLog rows={result.rows} />
    <AdminPagination page={result.currentPage} pages={result.pages} path="/admin/logi" /></>;
}
