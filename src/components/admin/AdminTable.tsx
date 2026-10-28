"use client";

import Link from "next/link";
import { Group, Select, Table, Text, TextInput } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminAd } from "../../lib/adminAds";
import { obituaryStatuses, statusLabels } from "../../lib/moderation";
import { useAdminAdMutation } from "./useAdminAdMutation";
import AdminAdActions from "./AdminAdActions";
import AdminIpBanButton from "./AdminIpBanButton";

export function adminDate(value?: string | Date | null, yearOnly = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return yearOnly ? String(date.getUTCFullYear()) : new Intl.DateTimeFormat("et-EE", {
    dateStyle: "short", timeStyle: "short", timeZone: "Europe/Tallinn",
  }).format(date);
}

export function AdminFilters({ query }: { query: string }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [state, setState] = useState({ source: query, draft: query, submitted: query });
  // Sync browser navigation while preserving edits during our own pending navigation.
  if (state.source !== query) {
    setState({ ...state, source: query, draft: query === state.submitted ? state.draft : query });
  }
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (query !== state.submitted) clearTimeout(timer.current);
  }, [query, state.submitted]);
  const params = new URLSearchParams(state.draft);

  function apply(values: URLSearchParams) {
    clearTimeout(timer.current);
    values.delete("page");
    for (const name of ["search", "ip"]) {
      if (values.has(name)) values.set(name, values.get(name)!.trim());
    }
    const submitted = values.toString();
    setState((current) => ({ ...current, submitted }));
    router.replace(`/admin/kuulutused?${submitted}`, { scroll: false });
  }
  function change(name: string, value: string | null, debounce = false) {
    const next = new URLSearchParams(state.draft);
    next.set(name, value ?? "");
    next.delete("page");
    setState((current) => ({ ...current, draft: next.toString() }));
    clearTimeout(timer.current);
    if (debounce) timer.current = setTimeout(() => apply(next), 350);
    else apply(next);
  }
  return <form method="GET" action="/admin/kuulutused" onSubmit={(event) => { event.preventDefault(); apply(params); }}>
    <Group align="end" mb="lg">
      <TextInput label="Otsi nime järgi" name="search" value={params.get("search") ?? ""} maxLength={100}
        onChange={(event) => change("search", event.currentTarget.value, true)} />
      <TextInput label="Saatja IP" name="ip" value={params.get("ip") ?? ""} maxLength={45}
        onChange={(event) => change("ip", event.currentTarget.value, true)} />
      <Select label="Vaatamine" name="unviewed" value={params.get("unviewed") === "true" ? "true" : "false"}
        onChange={(value) => change("unviewed", value)}
        data={[{ value: "false", label: "Kõik" }, { value: "true", label: "Vaatamata" }]} />
      <Select label="Olek" name="status" value={params.get("status") ?? ""} onChange={(value) => change("status", value)}
        data={[{ value: "", label: "Kõik olekud" }, ...obituaryStatuses.map((value) => ({ value, label: statusLabels[value] }))]} />
      <Select label="Allikas" name="source" value={params.get("source") ?? ""} onChange={(value) => change("source", value)}
        data={[{ value: "", label: "Kõik" }, { value: "manual", label: "Käsitsi" }, { value: "ai", label: "AI" }]} />
      <Select label="Järjestus" name="sort" value={params.get("sort") === "oldest" ? "oldest" : "newest"}
        onChange={(value) => change("sort", value)}
        data={[{ value: "newest", label: "Uuemad enne" }, { value: "oldest", label: "Vanemad enne" }]} />
    </Group>
  </form>;
}

export function AdminTable({ rows }: { rows: AdminAd[] }) {
  return <Table.ScrollContainer minWidth={960}><Table striped highlightOnHover>
    <Table.Thead><Table.Tr>{["Nimi", "Saatja e-post", "Saatja IP", "Saadetud", "Olek", "Allikas", "Toimingud"].map((label) => <Table.Th key={label}>{label}</Table.Th>)}</Table.Tr></Table.Thead>
    <Table.Tbody>{rows.map((ad) => <AdminRow key={`${ad._id}:${ad.version}:${ad.unviewed}:${ad.ipBlocked}`} ad={ad} />)}</Table.Tbody>
  </Table>{rows.length === 0 && <Text mt="md">Kuulutusi ei leitud.</Text>}</Table.ScrollContainer>;
}

function AdminRow({ ad }: { ad: AdminAd }) {
  const { current, busy, message, error, mutate } = useAdminAdMutation(ad);
  return <Table.Tr className={ad.unviewed ? "admin-unviewed" : undefined}>
    <Table.Td><Link href={`/admin/kuulutused/${ad._id}`} prefetch={false}>{current.name}</Link>
      {ad.unviewed && <span className="admin-new-label">UUS!</span>}</Table.Td>
    <Table.Td className="admin-contact">{current.email}</Table.Td>
    <Table.Td>{current.submitterIp ? <Link prefetch={false}
      href={`/admin/kuulutused?${new URLSearchParams({ ip: current.submitterIp })}`}>{current.submitterIp}</Link> : "—"}
      {current.submitterIp && <AdminIpBanButton ip={current.submitterIp} blocked={ad.ipBlocked} />}</Table.Td>
    <Table.Td>{adminDate(current.createdAt)}</Table.Td>
    <Table.Td>{current.trashed ? "Prügikast" : statusLabels[current.status]}</Table.Td>
    <Table.Td>{current.aiGenerated ? "AI" : "Käsitsi"}</Table.Td>
    <Table.Td className="admin-actions"><AdminAdActions ad={current} busy={busy} mutate={mutate} editingLink />
      {message && <Text role="status" size="sm">{message}</Text>}
      {error && <Text role="alert" c="red" size="sm">{error}</Text>}</Table.Td>
  </Table.Tr>;
}

export function AdminPagination({ page, pages, path, query = "" }: { page: number; pages: number; path: string; query?: string }) {
  function href(target: number) {
    const params = new URLSearchParams(query);
    params.set("page", String(target));
    return `${path}?${params}`;
  }
  return <Group mt="lg" justify="space-between" aria-label="Leheküljed">
    {page > 1 ? <Link href={href(page - 1)}>Eelmine</Link> : <span />}
    <Text>Leht {page} / {pages}</Text>
    {page < pages ? <Link href={href(page + 1)}>Järgmine</Link> : <span />}
  </Group>;
}
