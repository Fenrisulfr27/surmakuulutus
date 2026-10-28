"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button, Group, Table, Text, TextInput } from "@mantine/core";
import { useRouter } from "next/navigation";
import AdminIpBanButton from "./AdminIpBanButton";
import { adminDate } from "./AdminTable";

export default function AdminIpBans({ rows, search = "" }: { rows: Array<{ _id: string; ip: string; updatedAt: string }>; search?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const lock = useRef(false);
  const router = useRouter();
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = event.currentTarget;
    const ip = String(new FormData(form).get("ip") ?? "").trim();
    lock.current = true;
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/admin/ip-bans", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ip, blocked: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Salvestamine ebaõnnestus.");
      form.reset(); setSuccess("IP-aadress blokeeritud."); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Ühenduse viga."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <>
    <form onSubmit={add}><Group align="end" mb="lg">
      <TextInput name="ip" label="Blokeeri IP-aadress" maxLength={45} required />
      <Button type="submit" color="red" loading={busy}>Lisa IP-keeld</Button>
    </Group></form>
    {error && <Text role="alert" c="red">{error}</Text>}
    {success && <Text role="status">{success}</Text>}
    <form method="GET"><Group align="end" mb="lg"><TextInput name="ip" label="Otsi täpse IP järgi" defaultValue={search} maxLength={45} />
      <Button type="submit">Otsi</Button></Group></form>
    <Table.ScrollContainer minWidth={500}><Table striped><Table.Thead><Table.Tr>
      <Table.Th>IP-aadress</Table.Th><Table.Th>Muudetud</Table.Th><Table.Th>Toimingud</Table.Th>
    </Table.Tr></Table.Thead><Table.Tbody>{rows.map((row) => <Table.Tr key={row._id}>
      <Table.Td>{row.ip}</Table.Td><Table.Td>{adminDate(row.updatedAt)}</Table.Td>
      <Table.Td><AdminIpBanButton ip={row.ip} blocked /></Table.Td>
    </Table.Tr>)}</Table.Tbody></Table></Table.ScrollContainer>
    {!rows.length && <Text>IP-keelde ei leitud.</Text>}
  </>;
}
