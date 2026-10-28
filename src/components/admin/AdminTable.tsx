"use client";

import Link from "next/link";
import { Button, Group, Select, Table, Text, TextInput } from "@mantine/core";
import type { AdminAd } from "../../lib/adminAds";
import { obituaryStatuses, statusLabels } from "../../lib/moderation";

export function adminDate(value?: string | Date | null, yearOnly = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return yearOnly ? String(date.getUTCFullYear()) : new Intl.DateTimeFormat("et-EE", {
    dateStyle: "short", timeStyle: "short", timeZone: "Europe/Tallinn",
  }).format(date);
}

export function AdminFilters({ query }: { query: string }) {
  const params = new URLSearchParams(query);
  return <form method="GET" action="/admin/kuulutused">
    <Group align="end" mb="lg">
      <TextInput label="Otsi nime järgi" name="search" defaultValue={params.get("search") ?? ""} maxLength={100} />
      <Select label="Olek" name="status" defaultValue={params.get("status") ?? ""}
        data={[{ value: "", label: "Kõik olekud" }, ...obituaryStatuses.map((value) => ({ value, label: statusLabels[value] }))]} />
      <Select label="Allikas" name="source" defaultValue={params.get("source") ?? ""}
        data={[{ value: "", label: "Kõik" }, { value: "manual", label: "Käsitsi" }, { value: "ai", label: "AI" }]} />
      <Select label="Järjestus" name="sort" defaultValue={params.get("sort") === "oldest" ? "oldest" : "newest"}
        data={[{ value: "newest", label: "Uuemad enne" }, { value: "oldest", label: "Vanemad enne" }]} />
      <Select label="Vaade" name="deleted" defaultValue={params.get("deleted") === "true" ? "true" : "false"}
        data={[{ value: "false", label: "Kuulutused" }, { value: "true", label: "Kustutatud" }]} />
      <Button type="submit">Rakenda</Button>
    </Group>
  </form>;
}

export function AdminTable({ rows }: { rows: AdminAd[] }) {
  return <Table.ScrollContainer minWidth={760}><Table striped highlightOnHover>
    <Table.Thead><Table.Tr>{["Nimi", "Sünniaasta", "Surmaaasta", "Saadetud", "Olek", "Allikas", "Toimingud"].map((label) => <Table.Th key={label}>{label}</Table.Th>)}</Table.Tr></Table.Thead>
    <Table.Tbody>{rows.map((ad) => <Table.Tr key={ad._id}>
      <Table.Td>{ad.name}</Table.Td>
      <Table.Td>{adminDate(ad.birthYear, true)}</Table.Td>
      <Table.Td>{adminDate(ad.deathYear, true)}</Table.Td>
      <Table.Td>{adminDate(ad.createdAt)}</Table.Td>
      <Table.Td>{ad.deletedAt ? "Kustutatud" : statusLabels[ad.status]}</Table.Td>
      <Table.Td>{ad.aiGenerated ? "AI" : "Käsitsi"}</Table.Td>
      <Table.Td><Link href={`/admin/kuulutused/${ad._id}`}>Halda</Link></Table.Td>
    </Table.Tr>)}</Table.Tbody>
  </Table>{rows.length === 0 && <Text mt="md">Kuulutusi ei leitud.</Text>}</Table.ScrollContainer>;
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
