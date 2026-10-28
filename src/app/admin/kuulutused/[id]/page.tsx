import { notFound } from "next/navigation";
import { requirePageAdministrator } from "../../../../lib/adminPage";
import { getAdminAd } from "../../../../lib/adminAds";
import AdminEditor from "../../../../components/admin/AdminEditor";

export default async function AdminEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageAdministrator();
  const ad = await getAdminAd((await params).id);
  if (!ad) notFound();
  return <><h1>{ad.name}</h1><AdminEditor key={ad._id} ad={ad} /></>;
}
