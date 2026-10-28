import { notFound } from "next/navigation";
import { requirePageAdministrator } from "../../../../lib/adminPage";
import { getAdminAd } from "../../../../lib/adminAds";
import AdminEditor from "../../../../components/admin/AdminEditor";
import AdminViewed from "../../../../components/admin/AdminViewed";

export default async function AdminEditPage({ params }: { params: Promise<{ id: string }> }) {
  const administrator = await requirePageAdministrator();
  const ad = await getAdminAd((await params).id, administrator.id);
  if (!ad) notFound();
  return <><AdminViewed id={ad._id} unviewed={ad.unviewed} /><AdminEditor key={ad._id} ad={ad} /></>;
}
