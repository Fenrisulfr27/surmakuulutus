import { Paper, SimpleGrid, Text } from "@mantine/core";
import { pageAdministrator } from "../../lib/adminPage";
import { getAdminDashboard } from "../../lib/adminAds";
import { AdminLogin } from "../../components/admin/AdminAuthForms";
import { AdminTable } from "../../components/admin/AdminTable";

export default async function AdminPage() {
  if (!await pageAdministrator()) return <><h1>Logi sisse</h1><AdminLogin /></>;
  const dashboard = await getAdminDashboard();
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
    <h2>Viimased saadetud kuulutused</h2>
    <AdminTable rows={dashboard.recent} />
  </>;
}
