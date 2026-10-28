"use client";

import { useRef, useState } from "react";
import { Button, Group, Modal, Text } from "@mantine/core";
import { useRouter } from "next/navigation";

export default function AdminIpBanButton({ ip, blocked: initialBlocked = false }: { ip: string; blocked?: boolean }) {
  const [blocked, setBlocked] = useState(initialBlocked);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const router = useRouter();
  async function save() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/ip-bans", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ip, blocked: !blocked }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "IP-keelu salvestamine ebaõnnestus.");
      setBlocked(result.blocked);
      setConfirm(false);
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Ühenduse viga."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div>
    <Button size="compact-sm" variant="outline" color={blocked ? undefined : "red"} loading={busy}
      onClick={() => blocked ? void save() : setConfirm(true)}>{blocked ? "Tühista IP-keeld" : "Blokeeri IP"}</Button>
    {error && !confirm && <Text role="alert" size="sm" c="red">{error}</Text>}
    <Modal opened={confirm} onClose={() => !busy && setConfirm(false)} title="Blokeeri IP-aadress" centered>
      <Text>Kas blokeerida {ip}? Sellelt aadressilt ei saa uusi kuulutusi saata. Keeld kehtib kuni selle tühistamiseni.</Text>
      {error && <Text role="alert" c="red">{error}</Text>}
      <Group mt="md"><Button variant="default" disabled={busy} onClick={() => setConfirm(false)}>Loobu</Button>
        <Button color="red" loading={busy} onClick={save}>Kinnita IP-keeld</Button></Group>
    </Modal>
  </div>;
}
