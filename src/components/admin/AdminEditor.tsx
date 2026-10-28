"use client";

import { useRef, useState } from "react";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useRouter } from "next/navigation";
import AddAdForm from "../AddAdForm";
import AdCard from "../AdCard";
import type { AdFormValues } from "../../lib/adValidation";
import type { AdminAd } from "../../lib/adminAds";
import { statusLabels, statusTransitions, type ObituaryStatus } from "../../lib/moderation";

const actionLabels: Record<ObituaryStatus, string> = {
  published: "Avalda", rejected: "Lükka tagasi", archived: "Arhiveeri", pending: "Saada ülevaatamiseks",
};

export default function AdminEditor({ ad }: { ad: AdminAd }) {
  const [current, setCurrent] = useState(ad);
  const [values, setValues] = useState<AdFormValues>({
    name: ad.name, email: ad.email, topText: ad.topText ?? "", bottomText: ad.bottomText ?? "",
    poem: ad.poem ?? "", birthYear: ad.birthYear ? String(ad.birthYear).slice(0, 10) : "",
    deathYear: ad.deathYear ? String(ad.deathYear).slice(0, 10) : "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const lock = useRef(false);
  const router = useRouter();

  async function mutate(command: { action: string; status?: ObituaryStatus; values?: AdFormValues }) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/admin/kuulutused/${ad._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...command, version: current.version }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Salvestamine ebaõnnestus.");
      setCurrent(result);
      setConfirmDelete(false);
      setMessage("Muudatused salvestatud.");
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Ühenduse viga."); }
    finally { lock.current = false; setBusy(false); }
  }

  return <Stack>
    <Text>Olek: {current.deletedAt ? "Kustutatud" : statusLabels[current.status]} · Allikas: {current.aiGenerated ? "AI" : "Käsitsi"}</Text>
    <Group>
      {current.deletedAt ? <Button disabled={busy} onClick={() => mutate({ action: "restore" })}>Taasta arhiivi</Button> : <>
        {statusTransitions[current.status].map((status) => <Button key={status} disabled={busy} onClick={() => mutate({ action: "status", status })}>{actionLabels[status]}</Button>)}
        <Button color="red" variant="outline" disabled={busy} onClick={() => setConfirmDelete(true)}>Kustuta</Button>
      </>}
    </Group>
    {message && <Text role="status">{message}</Text>}
    {error && <Text role="alert" c="red">{error}</Text>}
    {!current.deletedAt && <div className="create-layout">
      <div className="create-panel"><AddAdForm values={values} onChange={setValues}
        onSubmit={(values) => mutate({ action: "edit", values })} isSubmitting={busy} editing /></div>
      <div className="create-preview"><AdCard ad={values} /></div>
    </div>}
    <Modal opened={confirmDelete} onClose={() => !busy && setConfirmDelete(false)} title="Kustuta kuulutus" centered>
      <Text>Kas kustutada „{ad.name}”? Kuulutus eemaldatakse avalikust vaatest. Selle saab hiljem taastada.</Text>
      <Group mt="md"><Button variant="default" disabled={busy} onClick={() => setConfirmDelete(false)}>Loobu</Button>
        <Button color="red" loading={busy} onClick={() => mutate({ action: "delete" })}>Kinnita kustutamine</Button></Group>
    </Modal>
  </Stack>;
}
