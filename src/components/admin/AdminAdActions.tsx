"use client";

import { useState } from "react";
import { ActionIcon, Button, Group, Modal, Text } from "@mantine/core";
import Link from "next/link";
import { statusTransitions, type ObituaryStatus } from "../../lib/moderation";
import type { AdminAd } from "../../lib/adminAds";

const actionLabels: Record<ObituaryStatus, string> = {
  published: "Avalda", rejected: "Lükka tagasi", archived: "Prügikast", pending: "Saada ülevaatamiseks",
};

export default function AdminAdActions({ ad, busy, mutate, editingLink = false, detailView = false }: {
  ad: AdminAd; busy: boolean; editingLink?: boolean; detailView?: boolean;
  mutate: (command: { action: string; status?: ObituaryStatus }) => Promise<boolean>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteButton = !ad.trashed && <ActionIcon className="admin-delete" size={detailView ? 48 : 32} variant="subtle" disabled={busy}
    aria-label="Kustuta" title="Saada prügikasti" onClick={() => setConfirmDelete(true)}>
    <svg width={detailView ? 28 : 18} height={detailView ? 28 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" />
    </svg>
  </ActionIcon>;
  return <>
    {detailView && <Group gap="xs" wrap="nowrap" align="center">
      <h1 style={{ margin: 0, minWidth: 0, overflowWrap: "anywhere" }}>{ad.name}</h1>
      {deleteButton}
    </Group>}
    <Group gap="xs" wrap="wrap">
      {editingLink && <Link href={`/admin/kuulutused/${ad._id}`} prefetch={false}>Muuda</Link>}
      {ad.trashed ? <Button size="compact-sm" disabled={busy} onClick={() => mutate({ action: "restore" })}>Taasta ja avalda</Button> : <>
        {statusTransitions[ad.status].map((status) => <Button size="compact-sm" key={status} disabled={busy}
          onClick={() => mutate({ action: "status", status })}>{actionLabels[status]}</Button>)}
        {!detailView && deleteButton}
      </>}
    </Group>
    <Modal opened={confirmDelete} onClose={() => !busy && setConfirmDelete(false)} title="Kustuta kuulutus" centered>
      <Text>Kas saata „{ad.name}” prügikasti? Kuulutus eemaldatakse avalikust vaatest. Selle saab prügikastist taastada ja avaldada.</Text>
      <Group mt="md"><Button variant="default" disabled={busy} onClick={() => setConfirmDelete(false)}>Loobu</Button>
        <Button color="red" loading={busy} onClick={async () => {
          if (await mutate({ action: "delete" })) setConfirmDelete(false);
        }}>Kinnita kustutamine</Button></Group>
    </Modal>
  </>;
}
