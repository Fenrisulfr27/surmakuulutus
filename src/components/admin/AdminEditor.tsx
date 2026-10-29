"use client";

import { useState } from "react";
import { Stack, Text } from "@mantine/core";
import AddAdForm from "../AddAdForm";
import AdCard from "../AdCard";
import type { AdFormValues } from "../../lib/adValidation";
import type { AdminAd } from "../../lib/adminAds";
import { statusLabels } from "../../lib/moderation";
import { useAdminAdMutation } from "./useAdminAdMutation";
import AdminAdActions from "./AdminAdActions";
import { adminDate } from "./AdminTable";
import AdminIpBanButton from "./AdminIpBanButton";

export default function AdminEditor({ ad }: { ad: AdminAd }) {
  const { current, busy, message, error, mutate } = useAdminAdMutation(ad);
  const [values, setValues] = useState<AdFormValues>({
    name: ad.name, email: ad.email ?? "", topText: ad.topText ?? "", bottomText: ad.bottomText ?? "",
    poem: ad.poem ?? "", birthYear: ad.birthYear ? String(ad.birthYear).slice(0, 10) : "",
    deathYear: ad.deathYear ? String(ad.deathYear).slice(0, 10) : "",
  });

  return <Stack>
    <AdminAdActions ad={current} busy={busy} mutate={mutate} detailView />
    <Text>Olek: {current.trashed ? "Prügikast" : statusLabels[current.status]} · Allikas: {current.sourceUrl ? "Surmakuulutused.ee" : current.aiGenerated ? "AI" : "Käsitsi"}</Text>
    <Text>Saatja: {current.email || "—"} · IP: {current.submitterIp ?? "—"}</Text>
    {current.submitterIp && <AdminIpBanButton key={`${current.submitterIp}:${ad.ipBlocked}`} ip={current.submitterIp} blocked={ad.ipBlocked} />}
    <Text>Sünniaasta: {adminDate(current.birthYear, true)} · Surmaaasta: {adminDate(current.deathYear, true)}</Text>
    {message && <Text role="status">{message}</Text>}
    {error && <Text role="alert" c="red">{error}</Text>}
    {!current.trashed && <div className="create-layout">
      <div className="create-panel"><AddAdForm values={values} onChange={setValues}
        onSubmit={async (values) => { await mutate({ action: "edit", values }); }} isSubmitting={busy} editing imported={Boolean(current.sourceUrl)} /></div>
      <div className="create-preview"><AdCard ad={values} /></div>
    </div>}
  </Stack>;
}
