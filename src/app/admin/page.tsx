import { Paper, SimpleGrid, Text } from "@mantine/core";
import { pageAdministrator } from "../../lib/adminPage";
import { getAdminDashboard } from "../../lib/adminAds";
import { AdminLogin } from "../../components/admin/AdminAuthForms";
import { AdminTable } from "../../components/admin/AdminTable";
import AdminLog from "../../components/admin/AdminLog";
import { listAdminActivity } from "../../lib/adminAudit";
import Link from "next/link";

export default async function AdminPage() {
  const administrator = await pageAdministrator();
  if (!administrator) return <><h1>Logi sisse</h1><AdminLogin /></>;
  const [dashboard, activity] = await Promise.all([
    getAdminDashboard(administrator.id), listAdminActivity(1, 8),
  ]);
  const statistics = [
    ["Kokku", dashboard.total], ["Avaldatud", dashboard.counts.published ?? 0],
    ["Ootel", dashboard.counts.pending ?? 0], ["Tagasi lükatud", dashboard.counts.rejected ?? 0],
    ["AI", dashboard.ai],
  ] as const;
  return <>
    <h1>Ülevaade</h1>
    <Text mb="md">Aktiivne andmebaas; kustutatud kuulutusi arvudes ei arvestata.</Text>
    <SimpleGrid cols={{ base: 2, md: 5 }}>
      {statistics.map(([label, count]) => <Paper key={label} withBorder p="md"><Text>{label}</Text><Text size="xl" fw={700}>{count}</Text></Paper>)}
    </SimpleGrid>
    <p className="admin-review-links"><Link href="/admin/kuulutused?status=pending">Ootel ({dashboard.counts.pending ?? 0})</Link>
      <Link href="/admin/kuulutused?unviewed=true">Vaatamata ({dashboard.unviewed})</Link></p>
    <h2>Ülevaatamist vajavad ja hiljutised kuulutused</h2>
    <AdminTable rows={dashboard.recent} />
    <h2>Viimased tegevused</h2>
    <AdminLog rows={activity.rows} />
    <p><Link href="/admin/logi">Kogu tegevuslogi</Link></p>
  </>;
}
